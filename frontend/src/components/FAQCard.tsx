import { Card, CardContent } from "@/components/ui/card";

interface FAQCardProps {
  question: string;
  answer: string;
  className?: string;
}

const FAQCard = ({ question, answer, className = "" }: FAQCardProps) => {
  return (
    <Card className={`neu-card border-0 ${className}`}>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">{question}</h3>
        <p className="text-muted-foreground">{answer}</p>
      </CardContent>
    </Card>
  );
};

export default FAQCard;
