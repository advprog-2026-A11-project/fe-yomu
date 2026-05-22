"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/components/providers/auth-provider";

const API_ADMIN = "/api/reading-admin";

export default function CreateEditReading() {
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    difficultyLevel: "BEGINNER",
    quizDurationMinutes: 10,
  });

  const [loading, setLoading] = useState(false);
  const [fetchingOld, setFetchingOld] = useState(false);

  useEffect(() => {
    if (editId) {
      const fetchOldData = async () => {
        try {
          setFetchingOld(true);
          const response = await fetch(`${API_ADMIN}/${editId}`, {
            headers: { ...(session?.profile?.id && { userId: session?.profile?.id }) },
          });
          if (response.ok) {
            const data = await response.json();
            setFormData({
              title: data.title || "",
              content: data.content || "",
              category: data.category || "",
              difficultyLevel: data.difficultyLevel || "BEGINNER",
              quizDurationMinutes: data.quizDurationMinutes || 10,
            });
          }
        } catch (error) {
          console.error("Fetch old data error:", error);
        } finally {
          setFetchingOld(false);
        }
      };
      fetchOldData();
    }
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editId ? `${API_ADMIN}/${editId}` : `${API_ADMIN}/create`;
    const method = editId ? "PUT" : "POST";

    setLoading(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          ...(session?.profile?.id && { userId: session.profile.id }),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        alert(`Failed to save: ${response.status} - ${errorData}`);
        return;
      }

      alert(editId ? "Material updated!" : "Material created!");
      router.push("/reading/admin");
      router.refresh();
    } catch (error) {
      console.error("Error saving reading:", error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingOld) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container" style={{ maxWidth: "760px" }}>
          <LoadingState message="Loading material data..." />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 0 4rem" }}>
      <div className="container" style={{ maxWidth: "760px" }}>
        <div style={{ marginBottom: "2rem" }}>
          <p className="yomu-eyebrow">{editId ? "Edit" : "Create"}</p>
          <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            {editId ? "Edit Reading Material" : "Create New Reading Exercise"}
          </h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter reading title"
              required
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
              <Input
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. News & Media, Sports"
                required
              />

              <div className="yomu-input-wrapper">
                <label className="yomu-input-label" htmlFor="difficulty-select">Difficulty</label>
                <select
                  id="difficulty-select"
                  className="yomu-input"
                  value={formData.difficultyLevel}
                  onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <Input
              label="Quiz Duration (minutes)"
              type="number"
              min="1"
              value={formData.quizDurationMinutes}
              onChange={(e) => setFormData({ ...formData, quizDurationMinutes: Math.max(1, Number(e.target.value) || 1) })}
              placeholder="10"
              required
            />

            <Textarea
              label="Content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Paste or write the reading content here..."
              rows={12}
              required
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Link href="/reading/admin">
                <Button variant="ghost" pill>Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" pill loading={loading}>
                {editId ? "Update Material" : "Save Material"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
