
import FAQ from "../components/FAQ"
import FinalCTA from "../components/FinalCTA"
import Hero from "../components/Hero"
import HowItWorks from "../components/HowItWorks"
import ImageEditing from "../components/ImageEditing"
import WhyChooseUs from "../components/WhyChooseUs"

function Home() {

  return (
    <main>

      {/* Hero */}

      <Hero />

      <ImageEditing />

      <WhyChooseUs />

      <HowItWorks />

      <FAQ />
      
      <FinalCTA />
      
    </main>
  )
}

export default Home