import { 
  Monitor,
  Database,
  Code,
  Smartphone,
  Settings,
  TestTube,
  Palette,
  BarChart,
  BarChart3,
  Users
} from "lucide-react";

export interface Profession {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

export const professions: Profession[] = [
  { 
    key: "frontend", 
    icon: Monitor, 
    color: "text-neon-blue"
  },
  { 
    key: "backend", 
    icon: Database, 
    color: "text-neon-cyan"
  },
  { 
    key: "fullstack", 
    icon: Code, 
    color: "text-neon-green"
  },
  { 
    key: "mobile", 
    icon: Smartphone, 
    color: "text-neon-purple"
  },
  { 
    key: "devops", 
    icon: Settings, 
    color: "text-neon-orange"
  },
  { 
    key: "qa", 
    icon: TestTube, 
    color: "text-neon-red"
  },
  { 
    key: "uxui", 
    icon: Palette, 
    color: "text-neon-pink"
  },
  { 
    key: "dataAnalyst", 
    icon: BarChart, 
    color: "text-neon-yellow"
  },
  { 
    key: "dataScientist", 
    icon: BarChart3, 
    color: "text-neon-indigo"
  },
  { 
    key: "productManager", 
    icon: Users, 
    color: "text-neon-teal"
  }
];
