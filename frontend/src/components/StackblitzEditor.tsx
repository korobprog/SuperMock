import React, { useEffect, useRef } from 'react';
import type { Project } from '@stackblitz/sdk';

type StackblitzVM = {
  applyFsDiff?: (diff: {
    create?: Record<string, string>;
    destroy?: string[];
    update?: Record<string, string>;
  }) => Promise<void>;
  getFsSnapshot?: () => Promise<Record<string, string>>;
  openFile?: (path: string) => Promise<void> | void;
};

type Language = 'javascript' | 'typescript' | 'python' | 'java';

interface StackblitzEditorProps {
  apiKey: string;
  code: string;
  language: Language;
  onChange: (code: string) => void;
  onError?: (message: string) => void;
}

// Embeds a StackBlitz project and keeps the main file in sync with parent state.
// Note: StackBlitz SDK generally does not require an API key for public embeds.
// The provided apiKey is stored for future features or enterprise/self-hosted setups.
export default function StackblitzEditor({
  apiKey,
  code,
  language,
  onChange,
  onError,
}: StackblitzEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vmRef = useRef<StackblitzVM | null>(null);
  const lastSentRef = useRef<string>(code);

  // Initialize embed once
  useEffect(() => {
    let isMounted = true;
    let pollTimer: number | null = null;

    async function init() {
      if (!containerRef.current) return;
      let sdk: typeof import('@stackblitz/sdk').default;
      try {
        const sdkModule = await import('@stackblitz/sdk');
        sdk = sdkModule.default;
      } catch (e) {
        onError?.('Не удалось загрузить StackBlitz SDK');
        return;
      }

      const mainFile = language === 'typescript' ? 'index.ts' : 'index.js';
      const project: Project = {
        files: {
          'index.html': `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Super Mock</title></head><body><div id="app"></div><script src="./${mainFile}"></script></body></html>`,
          [mainFile]: code,
        },
        title: 'Super Mock Interview',
        description: 'Live coding for interview',
        template: language === 'typescript' ? 'typescript' : 'javascript',
      };

      let vm: StackblitzVM | null = null;
      try {
        vm = await sdk.embedProject(containerRef.current, project, {
          height: '100%',
          openFile: mainFile,
          view: 'editor',
          clickToLoad: false,
          hideDevTools: true,
          theme: 'dark',
        });
      } catch (e) {
        onError?.(
          'Редактор StackBlitz недоступен. Используем локальный редактор.'
        );
        return;
      }
      if (!isMounted) return;
      vmRef.current = vm;
      lastSentRef.current = code;

      // Poll for file changes to propagate to parent
      const poll = async () => {
        try {
          if (!vmRef.current) return;
          const snapshot = await vmRef.current.getFsSnapshot?.();
          if (snapshot && typeof snapshot === 'object') {
            const content = snapshot[mainFile as keyof typeof snapshot] as
              | string
              | undefined;
            if (
              typeof content === 'string' &&
              content !== lastSentRef.current
            ) {
              lastSentRef.current = content;
              onChange(content);
            }
          }
        } catch (e) {
          // ignore polling error
        }
      };
      // Start polling
      pollTimer = window.setInterval(poll, 800) as unknown as number;
    }

    init();

    return () => {
      isMounted = false;
      if (pollTimer) window.clearInterval(pollTimer);
      vmRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push external updates from parent into the embed
  useEffect(() => {
    const vm = vmRef.current;
    if (!vm) return;
    const mainFile = language === 'typescript' ? 'index.ts' : 'index.js';
    if (code !== lastSentRef.current) {
      lastSentRef.current = code;
      // Try update file via fs diff; fallback to re-open file
      const apply = async () => {
        try {
          if (typeof vm.applyFsDiff === 'function') {
            await vm.applyFsDiff({ create: { [mainFile]: code }, destroy: [] });
          }
          if (typeof vm.openFile === 'function') {
            await vm.openFile(mainFile);
          }
        } catch (e) {
          // ignore SDK update error
        }
      };
      apply();
    }
  }, [code, language]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
