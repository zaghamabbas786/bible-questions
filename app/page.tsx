import { Suspense } from 'react'
import BibleQuestionsClient from './components/BibleQuestionsClient'

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BibleQuestionsClient />
    </Suspense>
  )
}

