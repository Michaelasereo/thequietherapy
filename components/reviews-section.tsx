import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Testimonials data - Nigerian doctors talking about therapy
const testimonials = [
  {
    quote:
      "As a practicing physician in Lagos, I've seen firsthand how mental health issues affect our patients. Quiet has revolutionized therapy access in Nigeria, making quality mental healthcare available to everyone.",
    location: "Lagos, Nigeria",
    title: "Dr. Adunni Okafor, MBBS",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "The stigma around mental health in Nigeria is slowly breaking down, and platforms like Quiet are leading this change. As a psychiatrist, I recommend it to my patients for its convenience and professionalism.",
    location: "Abuja, Nigeria",
    title: "Dr. Chidi Nwosu, MD Psychiatry",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "Working in emergency medicine, I see the mental health crisis daily. Quiet provides an essential service that bridges the gap between traditional healthcare and mental wellness in Nigeria.",
    location: "Kano, Nigeria",
    title: "Dr. Fatima Ibrahim, MBBS",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function ReviewsSection() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-black">Trusted by Healthcare Professionals!</h2>
            <p className="max-w-[900px] text-gray-600 text-lg md:text-xl leading-relaxed">
              With over 850+ healthcare professionals and medical students served. Here's what doctors and medical professionals have to say
            </p>
          </div>
        </div>
        
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3 md:grid-cols-2">
          {/* Testimonial 1 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                As a practicing physician in Lagos, I've seen firsthand how mental health issues affect our patients. Quiet has revolutionized therapy access in Nigeria, making quality mental healthcare available to everyone.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Dr. Adunni Okafor" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">AO</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Dr. Adunni Okafor, MBBS</p>
                  <p className="text-sm text-gray-600">Lagos, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 2 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                The stigma around mental health in Nigeria is slowly breaking down, and platforms like Quiet are leading this change. As a psychiatrist, I recommend it to my patients for its convenience and professionalism.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Dr. Chidi Nwosu" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">CN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Dr. Chidi Nwosu, MD Psychiatry</p>
                  <p className="text-sm text-gray-600">Abuja, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 3 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                Working in emergency medicine, I see the mental health crisis daily. Quiet provides an essential service that bridges the gap between traditional healthcare and mental wellness in Nigeria.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Dr. Fatima Ibrahim" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">FI</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Dr. Fatima Ibrahim, MBBS</p>
                  <p className="text-sm text-gray-600">Kano, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 4 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                As a pediatrician, I understand the importance of early mental health intervention. Quiet's platform makes it easier for Nigerian families to access quality therapy services for their children.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Dr. Emeka Okonkwo" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">EO</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Dr. Emeka Okonkwo, MBBS</p>
                  <p className="text-sm text-gray-600">Port Harcourt, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 5 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                The integration of technology and healthcare is crucial for Nigeria's future. Quiet's secure platform ensures patient confidentiality while making mental health services more accessible across the country.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Dr. Aisha Mohammed" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">AM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Dr. Aisha Mohammed, MD</p>
                  <p className="text-sm text-gray-600">Ibadan, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 6 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                Mental health awareness is growing in Nigeria, and Quiet is at the forefront of this movement. As a family medicine practitioner, I appreciate how it connects patients with qualified therapists.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Dr. Olumide Adebayo" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">OA</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Dr. Olumide Adebayo, MBBS</p>
                  <p className="text-sm text-gray-600">Benin City, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
