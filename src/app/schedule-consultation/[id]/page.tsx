//app/schedule-consultation/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Lawyer } from "@/types/lawyer"

// Available time slots
const TIME_SLOTS = [
  { id: "09-00", time: "9:00 AM", available: true },
  { id: "10-00", time: "10:00 AM", available: true },
  { id: "11-00", time: "11:00 AM", available: false },
  { id: "13-00", time: "1:00 PM", available: true },
  { id: "14-00", time: "2:00 PM", available: true },
  { id: "15-00", time: "3:00 PM", available: true },
  { id: "16-00", time: "4:00 PM", available: false },
]

// Duration options
const DURATIONS = [
  { id: "30", label: "30 minutes", value: 30 },
  { id: "60", label: "60 minutes", value: 60 },
  { id: "90", label: "90 minutes", value: 90 },
]

export default function ScheduleConsultationPage() {
  const router = useRouter()
  const params = useParams()
  const lawyerId = params.id as string
  const { user } = useUser()
  const { theme } = useTheme()
  const { toast } = useToast()
  
  const [lawyer, setLawyer] = useState<Lawyer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [selectedDuration, setSelectedDuration] = useState<number>(30)
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate next 7 available dates starting from today
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })

  useEffect(() => {
    const fetchLawyerProfile = async () => {
      if (!lawyerId) return
      
      setIsLoading(true)
      try {
        const res = await fetch(`/api/lawyers/${lawyerId}`)
        
        if (!res.ok) {
          throw new Error("Failed to fetch lawyer")
        }
        
        const data = await res.json()
        setLawyer(data)
      } catch (error) {
        console.error("Error fetching lawyer profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (lawyerId) {
      fetchLawyerProfile()
    }
  }, [lawyerId])

  const handleScheduleConsultation = async () => {
    if (!user?.id || !lawyerId || !selectedTimeSlot) {
      toast({
        title: "Error",
        description: "Please select a time slot to schedule your consultation.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Parse selected time and combine with selected date
    const [hours, minutes] = selectedTimeSlot.split('-').map(Number)
    const scheduledDateTime = new Date(selectedDate)
    scheduledDateTime.setHours(hours, minutes, 0, 0)

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          lawyerId: Number(lawyerId),
          scheduledAt: scheduledDateTime.toISOString(),
          duration: selectedDuration,
          status: 'pending',
          notes: notes.trim() || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to schedule consultation')
      }

      toast({
        title: "Consultation Scheduled",
        description: `Your consultation has been scheduled for ${scheduledDateTime.toLocaleDateString()} at ${
          TIME_SLOTS.find(slot => slot.id === selectedTimeSlot)?.time
        }.`,
      })

      // Redirect to lawyer chat
      router.push(`/lawyer-chat/${lawyerId}`)
    } catch (error) {
      console.error("Error scheduling consultation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule consultation",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const isDark = theme === 'dark'

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-primary"></div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-primary mb-4"></div>
        <p className="text-muted-foreground">Loading lawyer profile...</p>
      </div>
    )
  }

  if (!lawyer) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <h1 className="text-2xl font-bold mb-2">Lawyer Not Found</h1>
        <p className="text-muted-foreground mb-6">The lawyer you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/lawyer-connect">
          <Button>Back to Lawyers</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6 flex items-center">
          <Link href={`/lawyer-chat/${lawyerId}`} className="mr-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Schedule Consultation</h1>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Lawyer details sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                    <AvatarFallback>{lawyer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{lawyer.name}</CardTitle>
                    <CardDescription>{lawyer.specialization}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Experience</p>
                    <p className="text-sm text-muted-foreground">{lawyer.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Hourly Rate</p>
                    <p className="text-sm text-muted-foreground">{lawyer.hourlyRate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{lawyer.location}</p>
                  </div>
                  {lawyer.expertise && (
                    <div>
                      <p className="text-sm font-medium">Expertise</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {lawyer.expertise.map((item, i) => (
                          <div 
                            key={i}
                            className={`text-xs rounded-full px-2 py-1 ${
                              isDark ? 'bg-gray-800' : 'bg-gray-100'
                            }`}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  If you have any questions about scheduling a consultation, please contact our support team.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm">
                  <Info className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Booking form */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
                <CardDescription>Choose a date for your consultation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {availableDates.map((date, i) => (
                    <Button
                      key={i}
                      variant={selectedDate.toDateString() === date.toDateString() ? "default" : "outline"}
                      className="flex flex-col h-auto py-3"
                      onClick={() => setSelectedDate(date)}
                    >
                      <span className="text-xs">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="text-lg font-bold">{date.getDate()}</span>
                      <span className="text-xs">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Time</CardTitle>
                <CardDescription>Available time slots on {formatDate(selectedDate)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                      className="relative"
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot.id)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consultation Duration</CardTitle>
                <CardDescription>Select the duration of your consultation</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={selectedDuration.toString()} 
                  onValueChange={(value) => setSelectedDuration(parseInt(value))}
                  className="grid grid-cols-3 gap-2"
                >
                  {DURATIONS.map((duration) => (
                    <div key={duration.id}>
                      <RadioGroupItem
                        value={duration.value.toString()}
                        id={`duration-${duration.id}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`duration-${duration.id}`}
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer`}
                      >
                        <span className="text-xl font-bold">{duration.value}</span>
                        <span className="text-sm">minutes</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Estimated Cost</p>
                  <div className={`p-4 rounded-md ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <span>
                        <span className="font-medium">{lawyer.hourlyRate}</span> per hour × 
                        <span className="font-medium"> {selectedDuration / 60}</span> hour
                        {selectedDuration >= 60 ? 's' : ''}
                      </span>
                      <span className="text-lg font-bold">
                  <p className="text-sm text-muted-foreground">
  {lawyer.hourlyRate ? `₹${lawyer.hourlyRate}` : "Not Available"}
</p>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
                <CardDescription>Share any specific topics or questions you&apos;d like to discuss</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Example: I need help with a residential lease agreement..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={handleScheduleConsultation} 
                disabled={!selectedTimeSlot || isSubmitting}
                className="px-8"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Consultation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}