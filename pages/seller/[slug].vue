<script setup lang="ts">
import { getSellerProfile, type SellerPublicProfile } from '~/composables/seller'

const route = useRoute()
const sellerId = Number(route.params.slug)

if (isNaN(sellerId)) {
  throw createError({ statusCode: 404, statusMessage: 'Продавец не найден' })
}

const currentPage = ref(1)

const { data: profile, error, refresh, status } = await useAsyncData<SellerPublicProfile>(
  `seller-${sellerId}`,
  () => getSellerProfile(sellerId, currentPage.value),
  { watch: [currentPage] },
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Продавец не найден' })
}

async function handlePageChange(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

useSeoMeta({
  title: () => profile.value?.companyName ?? 'Профиль продавца',
  description: () =>
    profile.value?.aboutCompany?.slice(0, 160) ?? 'Публичный профиль продавца на маркетплейсе',
  ogTitle: () => profile.value?.companyName ?? 'Профиль продавца',
  ogDescription: () => profile.value?.aboutCompany?.slice(0, 160) ?? '',
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Error state -->
    <div v-if="error" class="text-center py-20">
      <p class="text-error text-lg">Продавец не найден или произошла ошибка.</p>
      <NuxtLink to="/" class="btn btn-primary mt-4">На главную</NuxtLink>
    </div>

    <template v-else-if="profile">
      <!-- Header -->
      <SellerProfileHeader
        :company-name="profile.companyName"
        :seller-id="profile.sellerId"
        class="mb-8"
      />

      <div class="divider my-6"></div>

      <!-- Two-column layout on large screens -->
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <!-- Left column: info -->
        <aside class="lg:w-80 flex-shrink-0 space-y-8">
          <SellerAboutSection :about-company="profile.aboutCompany" />
          <SellerContactsSection :phones="profile.phones" :branches="profile.branches" />
        </aside>

        <!-- Right column: gallery + offers -->
        <main class="flex-1 space-y-10">
          <SellerGallerySection :gallery="profile.gallery" />
          <SellerOffersSection
            :offers="profile.offers"
            :total="profile.total"
            :page="profile.page"
            :pages="profile.pages"
            :loading="status === 'pending'"
            @page-change="handlePageChange"
          />
        </main>
      </div>
    </template>

    <!-- Loading skeleton (initial load only) -->
    <template v-else>
      <div class="animate-pulse space-y-6">
        <div class="flex gap-4 items-center">
          <div class="w-20 h-20 rounded-full bg-base-300"></div>
          <div class="space-y-2">
            <div class="h-6 w-48 bg-base-300 rounded"></div>
            <div class="h-4 w-24 bg-base-300 rounded"></div>
          </div>
        </div>
        <div class="h-px bg-base-300"></div>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="n in 6" :key="n" class="h-48 bg-base-300 rounded-2xl"></div>
        </div>
      </div>
    </template>
  </div>
</template>
