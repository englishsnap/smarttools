
import FAQ from "../components/FAQ"
import FinalCTA from "../components/FinalCTA"
import Hero from "../components/Hero"
import HowItWorks from "../components/HowItWorks"
import ImageEditing from "../components/ImageEditing"
import WhyChooseUs from "../components/WhyChooseUs"
import { Helmet } from "react-helmet-async";

function Home() {

  return (

    <>
    <Helmet>
  <title>Smart Utility - Free Online PDF & File Tools</title>
  <meta
    name="description"
    content="Free browser-based online tools to compress, merge, split, and convert PDF documents securely on your device without file uploads."
  />
  <link
    rel="canonical"
    href="https://smartutility.pages.dev/"
  />
</Helmet>
    <main>

      {/* Hero */}

      <Hero />

      <ImageEditing />

      <WhyChooseUs />

      <HowItWorks />

      <FAQ />
      
      <FinalCTA />
      
    </main>

    </>
  )
}

export default Home