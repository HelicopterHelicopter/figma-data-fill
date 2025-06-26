"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import type { Quiz, QuizQuestion } from "../types/quiz"
import {
  calculateLiveTill,
  calculateResultDate,
  formatDate,
  formatDateTime,
  generateQuizTitle,
} from "../utils/dateUtils"
import { cn } from "@/lib/utils"

interface CreateQuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateQuiz: (quiz: Omit<Quiz, "id" | "status" | "participantsCount" | "winnersCount">) => void
  quizCount: number
}

export function CreateQuizModal({ open, onOpenChange, onCreateQuiz, quizCount }: CreateQuizModalProps) {
  const [liveFrom, setLiveFrom] = useState<Date>()
  const [questions, setQuestions] = useState<Omit<QuizQuestion, "id">[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: 0 },
  ])

  const addQuestion = () => {
    if (questions.length < 5) {
      setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswer: 0 }])
    }
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index: number, field: keyof Omit<QuizQuestion, "id">, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    const newOptions = [...updated[questionIndex].options] as [string, string, string, string]
    newOptions[optionIndex] = value
    updated[questionIndex] = { ...updated[questionIndex], options: newOptions }
    setQuestions(updated)
  }

  const handleSubmit = () => {
    if (!liveFrom || questions.length !== 5) return

    const liveTill = calculateLiveTill(liveFrom)
    const resultDate = calculateResultDate(liveFrom)
    const quiz: Omit<Quiz, "id" | "status" | "participantsCount" | "winnersCount"> = {
      title: generateQuizTitle(quizCount),
      liveFrom,
      liveTill,
      resultDate,
      questions: questions.map((q, i) => ({ ...q, id: `q${i + 1}` })),
    }

    onCreateQuiz(quiz)

    // Reset form
    setLiveFrom(undefined)
    setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }])
    onOpenChange(false)
  }

  const isFriday = (date: Date) => {
    return date.getDay() === 5 && date >= new Date(new Date().setHours(0, 0, 0, 0))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Live From Date (Friday 8:00 AM)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !liveFrom && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {liveFrom ? formatDate(liveFrom) : "Select Friday"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={liveFrom}
                  onSelect={setLiveFrom}
                  disabled={(date) => !isFriday(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {liveFrom && (
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">Quiz Schedule Summary:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>
                    <span className="font-medium">Live From:</span> {formatDateTime(liveFrom)}
                  </div>
                  <div>
                    <span className="font-medium">Live Till:</span> {formatDateTime(calculateLiveTill(liveFrom))}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Results Announced:</span>{" "}
                    {formatDateTime(calculateResultDate(liveFrom))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>Questions ({questions.length}/5)</Label>

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Question {qIndex + 1}</Label>
                  {questions.length > 1 && (
                    <Button onClick={() => removeQuestion(qIndex)} size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                  placeholder="Enter your question"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={question.correctAnswer === oIndex}
                        onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                        className="text-primary"
                      />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Show Add Question CTA after the last question */}
            {questions.length < 5 && (
              <div className="flex justify-center">
                <Button onClick={addQuestion} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question ({questions.length}/5)
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !liveFrom || questions.length !== 5 || questions.some((q) => !q.question || q.options.some((o) => !o))
              }
            >
              Create Quiz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
