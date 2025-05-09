//app/lawyer-registration/page.tsx
"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

// Define types for education and form data
interface Education {
  institution: string;
  degree: string;
  year: string;
}

interface LawyerFormData {
  name: string;
  avatar: string;
  specialization: string;
  experience: string;
  location: string;
  rating: number;
  hourlyRate: string;
  expertise: string[];
  availableNow: boolean;
  email: string;
  phone: string;
  bio: string;
  education: Education[];
  acceptTerms: boolean;
}

// Type for the lawyer data that will be sent to the API
interface LawyerApiData {
  name: string;
  avatar: string;
  specialization: string;
  experience: number;
  location: string;
  rating: number;
  hourlyRate: string;
  expertise: string[];
  availableNow: boolean;
  email: string;
  phone: string;
  bio: string;
  education: Education[];
}

export default function LawyerRegistration(): JSX.Element {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
//   const [errorMessage, setErrorMessage] = useState<string>("");
  
  const [formData, setFormData] = useState<LawyerFormData>({
    name: "",
    avatar: "/api/placeholder/150/150",
    specialization: "",
    experience: "",
    location: "",
    rating: 4.5, // Default rating
    hourlyRate: "",
    expertise: [],
    availableNow: false,
    email: "",
    phone: "",
    bio: "",
    education: [{ institution: "", degree: "", year: "" }],
    acceptTerms: false
  });

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=/lawyer-registration');
    }
    
    // Pre-fill user data from Clerk if available
    if (isLoaded && isSignedIn && user) {
      setFormData(prevData => ({
        ...prevData,
        name: user.fullName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        avatar: user.imageUrl || "/api/placeholder/150/150"
      }));
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Common expertise areas for lawyers
  const expertiseOptions: string[] = [
    "Family Law",
    "Criminal Law",
    "Corporate Law",
    "Property Law",
    "Intellectual Property",
    "Tax Law",
    "Labour Law",
    "Constitutional Law",
    "Environmental Law",
    "Cyber Law"
  ];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (type === "checkbox") {
      if (name === "expertise") {
        // Handle expertise checkboxes
        const updatedExpertise = [...formData.expertise];
        if (checked) {
          updatedExpertise.push(value);
        } else {
          const index = updatedExpertise.indexOf(value);
          if (index > -1) {
            updatedExpertise.splice(index, 1);
          }
        }
        setFormData({ ...formData, expertise: updatedExpertise });
      } else {
        // Handle other checkboxes
        setFormData({ ...formData, [name]: checked });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index][field] = value;
    setFormData({ ...formData, education: updatedEducation });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { institution: "", degree: "", year: "" }]
    });
  };

  const removeEducation = (index: number) => {
    const updatedEducation = [...formData.education];
    updatedEducation.splice(index, 1);
    setFormData({ ...formData, education: updatedEducation });
  };

  const nextStep = (): void => setStep(step + 1);
  const prevStep = (): void => setStep(step - 1);

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to your server/cloud storage
      // For this example, we'll just use a placeholder
      setFormData({ ...formData, avatar: "/api/placeholder/150/150" });
    }
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        return !!formData.name && !!formData.email && !!formData.phone;
      case 2:
        return !!formData.specialization && !!formData.experience && !!formData.location && !!formData.hourlyRate;
      case 3:
        return formData.expertise.length > 0 && !!formData.bio && formData.acceptTerms;
      default:
        return true;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }

    if (step < 3) {
      nextStep();
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert formData to match the database schema
      const lawyerData: LawyerApiData = {
        name: formData.name,
        avatar: formData.avatar,
        specialization: formData.specialization,
        experience: parseInt(formData.experience),
        location: formData.location,
        rating: parseFloat(formData.rating.toString()),
        hourlyRate: formData.hourlyRate,
        expertise: formData.expertise,
        availableNow: formData.availableNow,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        education: formData.education
      };

      // Make API call to save lawyer data
      const response = await fetch('/api/lawyer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lawyerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccessMessage("Registration successful! Redirecting to dashboard...");
      
      // Redirect to lawyer dashboard after a brief delay
      setTimeout(() => {
        router.push('/lawyer-dashboard');
      }, 2000);

    } catch (error) {
      console.error("Registration error:", error);
    //   setErrorMessage((error as Error).message || "An error occurred during registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while Clerk loads
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const renderStep = (): JSX.Element | null => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Account Information</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                <div className="mt-1 flex items-center">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                    <div className="relative h-full w-full">
                        <Image
                            src={formData.avatar}
                            alt="Avatar preview"
                            fill
                            className="object-cover"
                        />
                    </div>
                  </div>
                  <label className="ml-5 cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={!!user?.primaryEmailAddress} // Disable if email is from Clerk
              />
              {user?.primaryEmailAddress && (
                <p className="mt-1 text-xs text-gray-500">Email is associated with your account</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Professional Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Specialization</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select specialization</option>
                {expertiseOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, State"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Education</label>
              {formData.education.map((edu, index) => (
                <div key={index} className="mt-2 p-3 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Year</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  {formData.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEducation}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                Add education
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Areas of Expertise & Final Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Expertise</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {expertiseOptions.map(option => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`expertise-${option}`}
                      name="expertise"
                      value={option}
                      checked={formData.expertise.includes(option)}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`expertise-${option}`} className="ml-2 block text-sm text-gray-700">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Professional Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Tell clients about your background, approach, and expertise..."
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="availableNow"
                name="availableNow"
                checked={formData.availableNow}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="availableNow" className="ml-2 block text-sm text-gray-700">
                I am available for immediate consultation
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-800">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>
              </label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Register as a Lawyer</h1>

              {/* Progress steps */}
              <div className="mb-8">
                <div className="flex justify-between">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 ${
                        i < 3 ? "border-t-2 border-b-2" : ""
                      } ${
                        i <= step
                          ? "border-indigo-500"
                          : "border-gray-200"
                      } py-2`}
                    >
                      <div
                        className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                          i <= step
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {i < step ? <Check className="h-5 w-5" /> : i}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <div className="text-xs text-center w-1/3">Account</div>
                  <div className="text-xs text-center w-1/3">Professional Info</div>
                  <div className="text-xs text-center w-1/3">Professional Info</div>
                  <div className="text-xs text-center w-1/3">Expertise</div>
                </div>
              </div>

              {successMessage ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{successMessage}</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {renderStep()}
                  
                  <div className="mt-6 flex justify-between">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Previous
                      </button>
                    )}
                    <div className={step > 1 ? "ml-auto" : ""}>
                      <button
                        type="submit"
                        disabled={!validateStep() || isSubmitting}
                        className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          !validateStep() || isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {isSubmitting ? (
                          "Processing..."
                        ) : step < 3 ? (
                          "Next"
                        ) : (
                          "Complete Registration"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}