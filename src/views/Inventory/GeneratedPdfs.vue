<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-center gap-6">
                <div class="flex-1">
                    <h1 class="flex items-center gap-4 text-4xl font-extrabold text-slate-900 dark:text-slate-100 m-0 mb-2">
                        <MdiIcon name="mdi-download-outline" size="xl" class="text-primary" />
                        PDFs déjà générés
                    </h1>
                    <p class="text-slate-600 dark:text-slate-400 mt-2">
                        Inventaire : <span class="font-semibold text-primary">{{ inventoryReference }}</span>
                    </p>
                    <p class="text-sm text-slate-500 dark:text-slate-500 mt-3 max-w-3xl m-0">
                        Les jobs sont repliés par défaut : ouvrez un job pour voir ses PDFs par pages.
                        Utilisez la recherche pour réduire la liste sans tout faire défiler.
                    </p>
                </div>
                <div class="flex gap-3 shrink-0">
                    <button
                        type="button"
                        @click="loadGeneratedPdfs"
                        :disabled="loading"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <MdiIcon name="mdi-refresh" size="sm" :class="{ 'animate-spin': loading }" />
                        <span>Actualiser</span>
                    </button>
                    <button
                        type="button"
                        @click="goBack"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                        <MdiIcon name="mdi-arrow-left" size="sm" />
                        <span>Retour</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <div v-if="loading" class="flex flex-col items-center justify-center py-16">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
                <p class="text-slate-600 dark:text-slate-400">Chargement des PDFs…</p>
            </div>

            <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center">
                <MdiIcon name="mdi-close-circle-outline" size="xl" class="text-red-500 mb-4" />
                <h3 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Erreur</h3>
                <p class="text-slate-600 dark:text-slate-400 max-w-xl">{{ error }}</p>
            </div>

            <div v-else>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
                        <p class="text-sm text-slate-600 dark:text-slate-400">Jobs avec PDFs</p>
                        <p class="text-3xl font-bold text-slate-900 dark:text-slate-100">{{ responseData?.count_jobs ?? 0 }}</p>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
                        <p class="text-sm text-slate-600 dark:text-slate-400">PDFs disponibles</p>
                        <p class="text-3xl font-bold text-slate-900 dark:text-slate-100">{{ responseData?.count_pdfs ?? 0 }}</p>
                    </div>
                </div>

                <div
                    v-if="groupedResults.length"
                    class="sticky top-0 z-10 -mx-2 px-2 py-3 mb-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm">
                    <div class="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                        <div class="relative flex-1 min-w-0">
                            <MdiIcon name="mdi-magnify" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                v-model.trim="searchQuery"
                                type="search"
                                autocomplete="off"
                                placeholder="Filtrer par job, assignment ou chemin de fichier…"
                                class="w-full pl-11 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                            <button
                                v-if="searchQuery"
                                type="button"
                                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                aria-label="Effacer la recherche"
                                @click="searchQuery = ''">
                                <MdiIcon name="mdi-close-circle-outline" size="sm" />
                            </button>
                        </div>
                        <p class="text-sm text-slate-600 dark:text-slate-400 shrink-0 m-0">
                            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ filteredResults.length }}</span>
                            job(s) affiché(s)
                            <span v-if="searchQuery" class="text-slate-500"> sur {{ groupedResults.length }}</span>
                        </p>
                    </div>
                </div>

                <div v-if="!groupedResults.length" class="text-center py-16">
                    <MdiIcon name="mdi-close-circle-outline" size="xl" class="text-slate-400 mx-auto mb-4" />
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Aucun PDF généré</h3>
                    <p class="text-slate-600 dark:text-slate-400">Aucun fichier n'est disponible pour le moment.</p>
                </div>

                <div v-else-if="!filteredResults.length" class="text-center py-16">
                    <MdiIcon name="mdi-magnify" size="xl" class="text-slate-400 mx-auto mb-4" />
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Aucun résultat</h3>
                    <p class="text-slate-600 dark:text-slate-400">Aucun job ne correspond à « {{ searchQuery }} ».</p>
                </div>

                <template v-else>
                    <div class="flex flex-wrap items-center justify-between gap-3 mb-4 text-sm text-slate-600 dark:text-slate-400">
                        <span>
                            Page jobs <strong class="text-slate-900 dark:text-slate-100">{{ jobsPage }}</strong>
                            / {{ totalJobsPages }}
                            ({{ JOBS_PAGE_SIZE }} jobs par page)
                        </span>
                        <div class="flex gap-2">
                            <button
                                type="button"
                                :disabled="jobsPage <= 1"
                                class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-40"
                                @click="jobsPage = Math.max(1, jobsPage - 1)">
                                Précédent
                            </button>
                            <button
                                type="button"
                                :disabled="jobsPage >= totalJobsPages"
                                class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-40"
                                @click="jobsPage = Math.min(totalJobsPages, jobsPage + 1)">
                                Suivant
                            </button>
                        </div>
                    </div>

                    <div class="space-y-2 max-h-[min(70vh,720px)] overflow-y-auto pr-1 border border-slate-100 dark:border-slate-700/60 rounded-xl p-2">
                        <div
                            v-for="item in paginatedFilteredJobs"
                            :key="item.job.id"
                            class="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800/50">
                            <button
                                type="button"
                                class="w-full px-4 py-3 flex items-center gap-3 text-left bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                @click="toggleJob(item.job.id)">
                                <span
                                    class="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600"
                                    :class="{ 'rotate-90': expandedJobId === item.job.id }">
                                    <MdiIcon name="mdi-chevron-right" size="xs" class="text-slate-600 dark:text-slate-300 transition-transform" />
                                </span>
                                <div class="flex-1 min-w-0">
                                    <span class="font-semibold text-slate-900 dark:text-slate-100">{{ item.job.reference }}</span>
                                    <span class="text-slate-500 dark:text-slate-400 text-sm ml-2">
                                        — {{ item.pdfs.length }} PDF(s)
                                    </span>
                                </div>
                            </button>

                            <div v-if="expandedJobId === item.job.id" class="border-t border-slate-200 dark:border-slate-700">
                                <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50/80 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                                    <span>
                                        PDFs
                                        <strong>{{ pdfSliceForJob(item).start + 1 }}–{{ pdfSliceForJob(item).end }}</strong>
                                        sur {{ item.pdfs.length }}
                                    </span>
                                    <div class="flex gap-1">
                                        <button
                                            type="button"
                                            class="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40"
                                            :disabled="getPdfPage(item.job.id) <= 1"
                                            @click="setPdfPage(item.job.id, getPdfPage(item.job.id) - 1)">
                                            ←
                                        </button>
                                        <span class="px-2 py-1 tabular-nums">
                                            {{ getPdfPage(item.job.id) }} / {{ pdfTotalPagesForJob(item) }}
                                        </span>
                                        <button
                                            type="button"
                                            class="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40"
                                            :disabled="getPdfPage(item.job.id) >= pdfTotalPagesForJob(item)"
                                            @click="setPdfPage(item.job.id, getPdfPage(item.job.id) + 1)">
                                            →
                                        </button>
                                    </div>
                                </div>
                                <div class="overflow-x-auto max-h-[min(55vh,480px)] overflow-y-auto">
                                    <table class="w-full text-sm">
                                        <thead class="sticky top-0 z-[1] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm">
                                            <tr>
                                                <th class="text-left px-3 py-2">Assignment</th>
                                                <th class="text-left px-3 py-2 w-24">Comptage</th>
                                                <th class="text-left px-3 py-2">Fichier</th>
                                                <th class="text-right px-3 py-2 w-36">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr
                                                v-for="pdf in pdfSliceForJob(item).rows"
                                                :key="pdf.task_id"
                                                class="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                                <td class="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                    {{ pdf.assignment.reference }}
                                                </td>
                                                <td class="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                    {{ pdf.assignment.counting_order }}
                                                </td>
                                                <td class="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono text-xs break-all">
                                                    {{ pdf.pdf_path }}
                                                </td>
                                                <td class="px-3 py-2 text-right">
                                                    <button
                                                        type="button"
                                                        @click="downloadPdf(item.job, pdf)"
                                                        :disabled="downloadingTaskIds.has(pdf.task_id)"
                                                        class="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-primary text-primary text-xs hover:bg-primary hover:text-white transition-all disabled:opacity-50">
                                                        <MdiIcon name="mdi-download-outline" size="xs" />
                                                        <span>{{ downloadingTaskIds.has(pdf.task_id) ? '…' : 'Télécharger' }}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { JobService } from '@/services/jobService'
import { alertService } from '@/services/alertService'
import MdiIcon from '@/components/MdiIcon.vue'

interface GeneratedAssignmentPdf {
    task_id: string
    task_status: string
    assignment: {
        id: number
        reference: string
        status: string
        counting_order: number
    }
    pdf_path: string
    download_url: string
}

interface GeneratedAssignmentPdfItem {
    job: {
        id: number
        reference: string
        status: string
    }
    pdfs: GeneratedAssignmentPdf[]
}

interface GeneratedAssignmentPdfsResponse {
    count_jobs: number
    count_pdfs: number
    results: GeneratedAssignmentPdfItem[]
}

interface PdfRow {
    jobId: number
    jobReference: string
    taskId: string
    pdfPath: string
    downloadUrl: string
}

const JOBS_PAGE_SIZE = 25
const PDFS_PER_JOB_PAGE = 50

const route = useRoute()
const router = useRouter()
const inventoryReference = route.params.reference as string

const loading = ref(false)
const error = ref<string | null>(null)
const responseData = ref<GeneratedAssignmentPdfsResponse | null>(null)
const downloadingTaskIds = ref<Set<string>>(new Set())

const searchQuery = ref('')
const jobsPage = ref(1)
const expandedJobId = ref<number | null>(null)
const pdfPageByJobId = ref<Record<number, number>>({})

const groupedResults = computed<GeneratedAssignmentPdfItem[]>(() => {
    if (!responseData.value?.results?.length) return []
    return responseData.value.results.filter(
        (item) => item.pdfs && item.pdfs.length > 0
    )
})

const filteredResults = computed(() => {
    const q = searchQuery.value.toLowerCase()
    if (!q) return groupedResults.value

    return groupedResults.value.filter((item) => {
        if (item.job.reference?.toLowerCase().includes(q)) return true
        return item.pdfs.some((pdf) => {
            return (
                pdf.assignment.reference?.toLowerCase().includes(q) ||
                String(pdf.assignment.counting_order).includes(q) ||
                pdf.pdf_path?.toLowerCase().includes(q)
            )
        })
    })
})

const totalJobsPages = computed(() =>
    Math.max(1, Math.ceil(filteredResults.value.length / JOBS_PAGE_SIZE))
)

const paginatedFilteredJobs = computed(() => {
    const start = (jobsPage.value - 1) * JOBS_PAGE_SIZE
    return filteredResults.value.slice(start, start + JOBS_PAGE_SIZE)
})

watch([searchQuery, filteredResults], () => {
    jobsPage.value = 1
    const exp = expandedJobId.value
    if (exp != null && !filteredResults.value.some((i) => i.job.id === exp)) {
        expandedJobId.value = null
    }
})

watch(jobsPage, () => {
    const ids = new Set(paginatedFilteredJobs.value.map((i) => i.job.id))
    if (expandedJobId.value != null && !ids.has(expandedJobId.value)) {
        expandedJobId.value = null
    }
})

function toggleJob(jobId: number) {
    if (expandedJobId.value === jobId) {
        expandedJobId.value = null
        return
    }
    expandedJobId.value = jobId
    if (pdfPageByJobId.value[jobId] == null || pdfPageByJobId.value[jobId] < 1) {
        pdfPageByJobId.value = { ...pdfPageByJobId.value, [jobId]: 1 }
    }
}

function getPdfPage(jobId: number): number {
    const p = pdfPageByJobId.value[jobId]
    return p != null && p >= 1 ? p : 1
}

function setPdfPage(jobId: number, page: number) {
    const item = groupedResults.value.find((i) => i.job.id === jobId)
    const total = item ? Math.max(1, Math.ceil(item.pdfs.length / PDFS_PER_JOB_PAGE)) : 1
    const clamped = Math.min(Math.max(1, page), total)
    pdfPageByJobId.value = { ...pdfPageByJobId.value, [jobId]: clamped }
}

function pdfTotalPagesForJob(item: GeneratedAssignmentPdfItem): number {
    return Math.max(1, Math.ceil(item.pdfs.length / PDFS_PER_JOB_PAGE))
}

function pdfSliceForJob(item: GeneratedAssignmentPdfItem) {
    const totalPages = pdfTotalPagesForJob(item)
    const page = Math.min(Math.max(1, getPdfPage(item.job.id)), totalPages)
    const start = (page - 1) * PDFS_PER_JOB_PAGE
    const rows = item.pdfs.slice(start, start + PDFS_PER_JOB_PAGE)
    const end = start + rows.length
    return { rows, start, end: end === start ? start : end }
}

const toPdfRow = (job: GeneratedAssignmentPdfItem['job'], pdf: GeneratedAssignmentPdf): PdfRow => ({
    jobId: job.id,
    jobReference: job.reference,
    taskId: pdf.task_id,
    pdfPath: pdf.pdf_path,
    downloadUrl: pdf.download_url
})

const inferFileName = (row: PdfRow) => {
    const pathName = row.pdfPath?.split('/').pop()
    if (pathName) return pathName
    return `${row.jobReference}.pdf`
}

const loadGeneratedPdfs = async () => {
    loading.value = true
    error.value = null
    try {
        const response = await JobService.getGeneratedAssignmentPdfs()
        responseData.value = {
            count_jobs: response.count_jobs,
            count_pdfs: response.count_pdfs,
            results: response.results ?? []
        }
        expandedJobId.value = null
        pdfPageByJobId.value = {}
        jobsPage.value = 1
        searchQuery.value = ''
    } catch (err: any) {
        error.value = err?.response?.data?.message || err?.message || 'Erreur lors du chargement des PDFs générés'
    } finally {
        loading.value = false
    }
}

const downloadPdf = async (job: GeneratedAssignmentPdfItem['job'], pdf: GeneratedAssignmentPdf) => {
    const row = toPdfRow(job, pdf)
    downloadingTaskIds.value.add(row.taskId)
    try {
        const blob = await JobService.downloadGeneratedPdf(row.downloadUrl)
        const objectUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = inferFileName(row)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(objectUrl)
    } catch (err: any) {
        await alertService.error({
            text: err?.response?.data?.message || err?.message || 'Erreur lors du téléchargement du PDF'
        })
    } finally {
        downloadingTaskIds.value.delete(row.taskId)
    }
}

const goBack = () => {
    if (inventoryReference && route.params.warehouse) {
        router.push({
            name: 'inventory-affecter',
            params: {
                reference: inventoryReference,
                warehouse: route.params.warehouse as string
            }
        })
        return
    }
    router.back()
}

onMounted(() => {
    void loadGeneratedPdfs()
})
</script>
