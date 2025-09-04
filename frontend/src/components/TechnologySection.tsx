import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Monitor,
  Database,
  Settings,
  Rocket,
  Code,
  BarChart3
} from "lucide-react";

const TechnologySection = () => {
  return (
    <section className="py-16 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Современные <span className="gradient-secondary bg-clip-text text-transparent">технологии</span> на котором работает платформа
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Frontend Stack */}
          <Card className="neu-card border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Monitor className="h-8 w-8 text-neon-blue" />
                <CardTitle className="text-xl">Frontend</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4">
                React 19 + TypeScript + Vite + Tailwind CSS + Shadcn/ui
              </CardDescription>
              <div className="space-y-2">
                <Badge variant="secondary">React 19</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Vite</Badge>
                <Badge variant="secondary">Tailwind CSS</Badge>
                <Badge variant="secondary">Shadcn/ui</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Backend Stack */}
          <Card className="neu-card border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-neon-cyan" />
                <CardTitle className="text-xl">Backend</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4">
                Node.js + Express + TypeScript + Prisma ORM
              </CardDescription>
              <div className="space-y-2">
                <Badge variant="secondary">Node.js</Badge>
                <Badge variant="secondary">Express</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Prisma ORM</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure Stack */}
          <Card className="neu-card border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-neon-purple" />
                <CardTitle className="text-xl">Infrastructure</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4">
                PostgreSQL + Redis + Docker + Nginx + Traefik
              </CardDescription>
              <div className="space-y-2">
                <Badge variant="secondary">PostgreSQL</Badge>
                <Badge variant="secondary">Redis</Badge>
                <Badge variant="secondary">Docker</Badge>
                <Badge variant="secondary">Nginx</Badge>
                <Badge variant="secondary">Traefik</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Security & Communication */}
          <Card className="neu-card border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Rocket className="h-8 w-8 text-neon-green" />
                <CardTitle className="text-xl">Security & WebRTC</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4">
                Let's Encrypt SSL/TLS + TURN/STUN серверы
              </CardDescription>
              <div className="space-y-2">
                <Badge variant="secondary">Let's Encrypt</Badge>
                <Badge variant="secondary">SSL/TLS</Badge>
                <Badge variant="secondary">TURN/STUN</Badge>
                <Badge variant="secondary">WebRTC</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Development Tools */}
          <Card className="neu-card border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Code className="h-8 w-8 text-neon-orange" />
                <CardTitle className="text-xl">Development</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4">
                Docker Compose + Полная схема БД
              </CardDescription>
              <div className="space-y-2">
                <Badge variant="secondary">Docker Compose</Badge>
                <Badge variant="secondary">Полная схема БД</Badge>
                <Badge variant="secondary">Контейнеризация</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card className="neu-card border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-neon-pink" />
                <CardTitle className="text-xl">Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4">
                Кэширование + Reverse Proxy
              </CardDescription>
              <div className="space-y-2">
                <Badge variant="secondary">Redis Cache</Badge>
                <Badge variant="secondary">Reverse Proxy</Badge>
                <Badge variant="secondary">High Performance</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
