import { BarChart3, BookOpen, Award, LightbulbIcon } from 'lucide-react'

const benefits = [
  {
    icon: <BookOpen className="h-8 w-8 text-blue-600" />,
    title: 'Courses from Recognized Hungarian Universities',
    description: 'Learn from courses created by the best Hungarian universities and their instructors to help you in your professional development.',
  },
  {
    icon: <LightbulbIcon className="h-8 w-8 text-blue-600" />,
    title: 'Personalized Learning Experience',
    description: 'Our AI-based system helps you find the most suitable courses and learning paths for you.',
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
    title: 'Detailed Progress Statistics',
    description: 'Track your learning progress with detailed reports and performance indicators.',
  },
  {
    icon: <Award className="h-8 w-8 text-blue-600" />,
    title: 'Recognized Certificates',
    description: 'Earn officially recognized certificates that hold real value in the job market.',
  },
]

export const BenefitsGrid = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">
          Why Choose DMA?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 