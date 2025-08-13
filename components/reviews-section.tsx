import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { testimonials } from "@/lib/data"

export default function ReviewsSection() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-black">People Loved us!</h2>
            <p className="max-w-[900px] text-gray-600 text-lg md:text-xl leading-relaxed">
              With over 10,000 Users served. Here's What they have to say
            </p>
          </div>
        </div>
        
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3 md:grid-cols-2">
          {/* Testimonial 1 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                Trpi has been a game-changer for my mental well-being. The platform is easy to use, and my therapist is incredibly supportive.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Lagos, Nigeria" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">L</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Lagos, Nigeria</p>
                  <p className="text-sm text-gray-600">Marketing Specialist</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 2 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                I appreciate the flexibility Trpi offers. I can book sessions around my busy schedule, and the quality of therapy is exceptional.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Nairobi, Kenya" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">N</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Nairobi, Kenya</p>
                  <p className="text-sm text-gray-600">Software Engineer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 3 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                Finding the right therapist felt daunting, but Trpi made it simple. Highly recommend their personalized approach.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Accra, Ghana" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">A</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Accra, Ghana</p>
                  <p className="text-sm text-gray-600">Student</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 4 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                The quality of care I've received through Trpi has been outstanding. My therapist truly understands my needs.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Cairo, Egypt" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">C</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Cairo, Egypt</p>
                  <p className="text-sm text-gray-600">Teacher</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 5 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                Trpi's secure platform gives me peace of mind. I can focus on my therapy without worrying about privacy.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Johannesburg, South Africa" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">J</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Johannesburg, South Africa</p>
                  <p className="text-sm text-gray-600">Healthcare Worker</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 6 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                The convenience of online therapy has made all the difference. Trpi makes mental health care accessible.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Casablanca, Morocco" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">C</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Casablanca, Morocco</p>
                  <p className="text-sm text-gray-600">Entrepreneur</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
