<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-6 w-6 text-gray-700"
    viewBox="0 0 100 100"
    fill="black"
  >
    <!-- Fond du clipboard -->
    <rect
      x="12" y="8"
      width="76" height="84"
      rx="4"
      fill="black"
      opacity="0.1"
    />

    <!-- Clip en haut -->
    <rect
      x="35" y="2"
      width="30" height="12"
      rx="2"
      fill="black"
      opacity="0.3"
    />

    <!-- Ligne 1 cochée -->
    <g>
      <rect
        x="18" y="26"
        width="14" height="14"
        rx="2"
        fill="black"
        opacity="0.2"
      />
      <path
        d="M21 32 L25 36 L33 28"
        stroke="black"
        stroke-width="2"
        fill="none"
      />
      <line
        x1="36" y1="32" x2="72" y2="32"
        stroke="black"
        stroke-width="2"
        opacity="0.6"
      />
    </g>

    <!-- Ligne 2 -->
    <g>
      <rect
        x="18" y="44"
        width="12" height="12"
        rx="2"
        fill="black"
        opacity="0.2"
      />
      <line
        x1="36" y1="50" x2="72" y2="50"
        stroke="black"
        stroke-width="2"
        opacity="0.6"
      />
    </g>

    <!-- Ligne 3 -->
    <g>
      <rect
        x="18" y="62"
        width="12" height="12"
        rx="2"
        fill="black"
        opacity="0.2"
      />
      <line
        x1="36" y1="68" x2="72" y2="68"
        stroke="black"
        stroke-width="2"
        opacity="0.6"
      />
    </g>
  </svg>
</template>
