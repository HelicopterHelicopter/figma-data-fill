"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye, Trophy, Clock, Users, Edit, Trash2 } from "lucide-react"
import type { Quiz } from "./types/quiz"
import { mockQuizzes, mockWinners } from "./data/mockData"
import { formatDateTime, getQuizStatus, canEditOrDelete } from "./utils/dateUtils"
import { CreateQuizModal } from "./components/CreateQuizModal"
import { EditQuizModal } from "./components/EditQuizModal"
import { QuizDetailsModal } from "./components/QuizDetailsModal"
import { WinnersModal } from "./components/WinnersModal"

export default function QuizScheduler() {
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [winnersModalOpen, setWinnersModalOpen] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Update quiz statuses based on current time
  useEffect(() => {
    setQuizzes((prevQuizzes) =>
      prevQuizzes.map((quiz) => ({
        ...quiz,
        status: getQuizStatus(quiz),
      })),
    )
  }, [currentTime])

  const handleCreateQuiz = (newQuiz: Omit<Quiz, "id" | "status" | "participantsCount" | "winnersCount">) => {
    const quiz: Quiz = {
      ...newQuiz,
      id: Date.now().toString(),
      status: "scheduled",
      participantsCount: 0,
    }
    setQuizzes([...quizzes, quiz])
  }

  const handleUpdateQuiz = (updatedQuiz: Quiz) => {
    setQuizzes(quizzes.map((quiz) => (quiz.id === updatedQuiz.id ? updatedQuiz : quiz)))
  }

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId))
  }

  const handleViewDetails = (quiz: Quiz, index: number) => {
    setSelectedQuiz(quiz)
    setSelectedQuizIndex(index + 1)
    setDetailsModalOpen(true)
  }

  const handleEditQuiz = (quiz: Quiz, index: number) => {
    setSelectedQuiz(quiz)
    setSelectedQuizIndex(index + 1)
    setEditModalOpen(true)
  }

  const handleViewWinners = (quiz: Quiz, index: number) => {
    setSelectedQuiz(quiz)
    setSelectedQuizIndex(index + 1)
    setWinnersModalOpen(true)
  }

  const getStatusColor = (status: Quiz["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-500"
      case "scheduled":
        return "bg-blue-500"
      case "live":
        return "bg-green-500"
      case "completed":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const liveQuiz = quizzes.find((quiz) => quiz.status === "live")
  const liveQuizIndex = liveQuiz ? quizzes.findIndex((quiz) => quiz.id === liveQuiz.id) + 1 : 0
  const upcomingQuizzes = quizzes.filter((quiz) => quiz.status === "scheduled" || quiz.status === "draft")
  const pastQuizzes = quizzes.filter((quiz) => quiz.status === "completed")

  const getTimeRemaining = (date: Date) => {
    const diff = date.getTime() - currentTime.getTime()
    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quiz Scheduler</h1>
            <p className="text-muted-foreground">Manage your quiz competitions</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        </div>

        {/* Live Quiz Banner */}
        {liveQuiz && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  <CardTitle className="text-green-800">Live Quiz</CardTitle>
                </div>
                <Badge className="bg-green-500">LIVE</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="font-semibold text-green-800">Quiz #{liveQuizIndex}</h3>
                  <p className="text-sm text-green-600">Currently running</p>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{getTimeRemaining(liveQuiz.liveTill)}</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{liveQuiz.participantsCount} participants</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(liveQuiz, liveQuizIndex - 1)}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz Tables */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcomingQuizzes.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastQuizzes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Quizzes</CardTitle>
                <CardDescription>Scheduled and draft quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingQuizzes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No upcoming quizzes</p>
                    <Button variant="outline" className="mt-4" onClick={() => setCreateModalOpen(true)}>
                      Create your first quiz
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S No</TableHead>
                        <TableHead>Live From</TableHead>
                        <TableHead>Live Till</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingQuizzes.map((quiz, index) => {
                        const originalIndex = quizzes.findIndex((q) => q.id === quiz.id)
                        return (
                          <TableRow key={quiz.id}>
                            <TableCell className="font-medium">{originalIndex + 1}</TableCell>
                            <TableCell>{formatDateTime(quiz.liveFrom)}</TableCell>
                            <TableCell>{formatDateTime(quiz.liveTill)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(quiz.status)}>{quiz.status.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(quiz, originalIndex)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {canEditOrDelete(quiz.liveFrom) && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditQuiz(quiz, originalIndex)}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteQuiz(quiz.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle>Past Quizzes</CardTitle>
                <CardDescription>Completed quiz competitions</CardDescription>
              </CardHeader>
              <CardContent>
                {pastQuizzes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No completed quizzes yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S No</TableHead>
                        <TableHead>Live From to Live Till</TableHead>
                        <TableHead>Result Date</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Winners</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastQuizzes.map((quiz, index) => {
                        const originalIndex = quizzes.findIndex((q) => q.id === quiz.id)
                        return (
                          <TableRow key={quiz.id}>
                            <TableCell className="font-medium">{originalIndex + 1}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{formatDateTime(quiz.liveFrom)}</div>
                                <div className="text-muted-foreground">to {formatDateTime(quiz.liveTill)}</div>
                              </div>
                            </TableCell>
                            <TableCell>{formatDateTime(quiz.resultDate)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {quiz.participantsCount || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
                                {quiz.winnersCount || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(quiz, originalIndex)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewWinners(quiz, originalIndex)}
                                >
                                  <Trophy className="h-4 w-4 mr-1" />
                                  Winners
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateQuizModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateQuiz={handleCreateQuiz}
        quizCount={quizzes.length}
      />

      <EditQuizModal
        quiz={selectedQuiz}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdateQuiz={handleUpdateQuiz}
        quizNumber={selectedQuizIndex}
      />

      <QuizDetailsModal
        quiz={selectedQuiz}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        quizNumber={selectedQuizIndex}
      />

      <WinnersModal
        quiz={selectedQuiz}
        winners={selectedQuiz ? mockWinners[selectedQuiz.id] || [] : []}
        open={winnersModalOpen}
        onOpenChange={setWinnersModalOpen}
        quizNumber={selectedQuizIndex}
      />
    </div>
  )
}
