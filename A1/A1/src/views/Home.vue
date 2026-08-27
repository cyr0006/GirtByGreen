<template>
  <hero />
  <section class="py-20 px-8 text-center">
    <h2 class="text-3xl font-bold mb-6 text-center">Why Choose Us</h2>
    <p class="text-surface-600 leading-relaxed mb-8">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus
      hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus, ut eleifend
      nibh porttitor.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
      <div class="text-center p-6">
        <h3 class="text-xl font-semibold mb-3">For &amp; by the community</h3>
        <p class="text-surface-500 text-sm leading-relaxed">
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
          commodo consequat. Duis aute irure dolor in reprehenderit.
        </p>
      </div>
      <div class="text-center p-6">
        <h3 class="text-xl font-semibold mb-3">What we do</h3>
        <p class="text-surface-500 text-sm leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam.
        </p>
      </div>
      <div class="text-center p-6">
        <h3 class="text-xl font-semibold mb-3">24/7 Support</h3>
        <p class="text-surface-500 text-sm leading-relaxed">
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
          anim id est laborum. Sed ut perspiciatis unde omnis.
        </p>
      </div>
    </div>

    <div class="mt-16 text-center">
      <h2 class="text-2xl font-bold mb-4">Our Mission</h2>
      <ul class="space-y-3 text-surface-600 inline-block text-left">
        <li class="flex items-start gap-3">
          <span class="text-primary mt-1">&#10003;</span>
          <span
            >Lorem ipsum dolor sit amet, consectetur adipiscing elit donec id elit non mi porta
            gravida at eget.</span
          >
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary mt-1">&#10003;</span>
          <span
            >Integer posuere erat a ante venenatis dapibus velit aliquet. Maecenas sed diam.</span
          >
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary mt-1">&#10003;</span>
          <span
            >Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum
            massa justo sit amet risus.</span
          >
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary mt-1">&#10003;</span>
          <span
            >Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis
            lacus vel augue laoreet.</span
          >
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import hero from '@/components/hero.vue'
</script>
