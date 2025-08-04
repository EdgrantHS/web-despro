'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    testDatabaseConnection()
  }, [])

  const testDatabaseConnection = async () => {
    // suggested implementation: test database connectivity and table access
    // setLoading(true)
    // const testResults: string[] = []

    // // Test each table we're using
    // const tablesToTest = [
    //   'node',
    //   'user', 
    //   'users', // test both singular and plural
    //   'item_instance',
    //   'item_type',
    //   'report',
    //   'privilege',
    //   'recipe',
    //   'item_transit'
    // ]

    // for (const tableName of tablesToTest) {
    //   try {
    //     const { data, error } = await supabase
    //       .from(tableName)
    //       .select('*', { count: 'exact', head: true })
    //     
    //     if (error) {
    //       testResults.push(`❌ ${tableName}: ${error.message}`)
    //     } else {
    //       testResults.push(`✅ ${tableName}: Table exists and accessible`)
    //     }
    //   } catch (err) {
    //     testResults.push(`❌ ${tableName}: ${err}`)
    //   }
    // }

    // setErrors(testResults)
    // setLoading(false)
  }

  if (loading) {
    return <div className="p-6">Testing database connection...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Database Debug Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Table Connection Test</h2>
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className={`p-2 rounded ${
              error.startsWith('✅') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {error}
            </div>
          ))}
        </div>
        
        <button
          onClick={testDatabaseConnection}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Again
        </button>
      </div>
    </div>
  )
}
