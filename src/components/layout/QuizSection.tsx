import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function StartQuizSection({ onStart }: Readonly<{ onStart?: () => void }>) {
  return (
    <Card variant="pressed" style={{ marginTop: "3rem", textAlign: "center", background: "var(--success-soft)", borderColor: "var(--success)" }}>
      <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--success-shadow)" }}>
        Finish Reading?
      </h4>
      <p style={{ margin: "0 0 1.5rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
        Test your knowledge by taking the quiz. You won't be able to retake it!
      </p>
      <Button variant="success" size="lg" pill onClick={onStart}>
        Start Quiz →
      </Button>
    </Card>
  );
}
