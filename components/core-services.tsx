import { coreServices } from "@/lib/data"

export default function CoreServices() {
  return (
    <section id="therapy" className="w-full py-16 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-black">Core Services</h2>
            <p className="max-w-[600px] text-gray-600 text-lg md:text-xl leading-relaxed">
              Everything you need to provide better patient care
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coreServices.map((service, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <service.icon className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">
                {service.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
