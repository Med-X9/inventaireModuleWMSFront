/**
 * Service pour récupérer les données du tableau
 */
export async function fetchData<T = any>(url: string): Promise<T[]> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status} lors du fetch de ${url}`)
  }
  return await res.json()
}

