import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { QueryProvider } from './app/QueryProvider'

export default function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}
