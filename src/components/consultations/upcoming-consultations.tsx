//components/consultations/upcoming-consultations.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Video, FileEdit, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@clerk/nextjs"

type Consultation = {
  id: number
  userId: string
  lawyerId: number
  scheduledAt: string
  duration: number
  status: string
  notes: string | null
  createdAt: string
}

interface UpcomingConsultationsProps {
  lawyerId: string
}

export default function UpcomingConsultations({ lawyerId }: UpcomingConsultationsProps) {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchConsultations = async () => {
      if (!user?.id || !lawyerId) return
      
      setIsLoading(true)
      try {
        const res = await fetch(`/api/lawyers/${lawyerId}/consultations?status=pending,confirmed`)
        
        if (!res.ok) {
          throw new Error("Failed to fetch consultations")
        }
        
        const data = await res.json()
        setConsultations(data)
      } catch (error) {
        console.error("Error fetching consultations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id && lawyerId) {
      fetchConsultations()
    }
  }, [user?.id, lawyerId])

  const handleReschedule = (consultationId: number) => {
    router.push(`/reschedule-consultation/${lawyerId}?id=${consultationId}`)
  }

  const handleCancel = async (consultationId: number) => {
    try {
      const res = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled'
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to cancel consultation")
      }

      toast({
        title: "Consultation Cancelled",
        description: "Your consultation has been cancelled successfully.",
      })

      // Remove from list
      setConsultations(prev => prev.filter(c => c.id !== consultationId))
    } catch (error) {
      console.error("Error cancelling consultation:", error)
      toast({
        title: "Error",
        description: "Failed to cancel consultation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-400 text-yellow-500">
            Pending
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge variant="outline" className="border-green-400 text-green-500">
            Confirmed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Consultations</CardTitle>
          <CardDescription>Loading your scheduled consultations...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-law-primary"></div>
        </CardContent>
      </Card>
    )
  }

  if (consultations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Consultations</CardTitle>
          <CardDescription>You dont have any upcoming consultations scheduled.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-4">No consultations scheduled</p>
          <Button onClick={() => router.push(`/schedule-consultation/${lawyerId}`)}>
            Schedule Now
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Consultations</CardTitle>
        <CardDescription>Your scheduled consultations with this lawyer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {consultations.map((consultation) => {
          const scheduledDate = new Date(consultation.scheduledAt)
          const isToday = new Date().toDateString() === scheduledDate.toDateString()

          return (
            <div 
              key={consultation.id} 
              className="border rounded-lg p-4 relative space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-law-primary" />
                  <div>
                    <p className="font-medium">
                      {isToday ? 'Today' : formatDate(consultation.scheduledAt)}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatTime(consultation.scheduledAt)}</span>
                      <span className="mx-1">•</span>
                      <span>{consultation.duration} minutes</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(consultation.status)}
              </div>
              
              {consultation.notes && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <p className="font-medium text-xs mb-1">Notes:</p>
                  <p>{consultation.notes}</p>
                </div>
              )}
              
              <div className="flex justify-between">
                {consultation.status === 'confirmed' && (
                  <Button variant="outline" size="sm" className="text-green-500">
                    <Video className="mr-1 h-4 w-4" />
                    Join Meeting
                  </Button>
                )}
                
                {consultation.status === 'pending' && (
                  <Button variant="outline" size="sm" className="text-muted-foreground">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    Awaiting Confirmation
                  </Button>
                )}
                
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleReschedule(consultation.id)}
                  >
                    <FileEdit className="mr-1 h-4 w-4" />
                    Reschedule
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCancel(consultation.id)}
                    className="text-red-500"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={() => router.push(`/schedule-consultation/${lawyerId}`)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Another Consultation
        </Button>
      </CardFooter>
    </Card>
  )
}