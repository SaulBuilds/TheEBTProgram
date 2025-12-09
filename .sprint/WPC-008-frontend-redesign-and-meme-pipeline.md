# WPC-008: Frontend Redesign and Meme Pipeline (Refined)

**Status:** Proposed

**Owner:** Gemini

**Timeline:** TBD

**Dependencies:** None

## Objective

This work package covers the redesign of the frontend aesthetics to create a clearer, more memetic narrative, and the implementation of a "meme pipeline" to generate custom memes for users upon successful application.

## Work Breakdown

### WPC-008-A: Frontend Redesign

*   **Task A1: Aesthetic Overhaul.**
    *   **Description:** Update the global styles and individual components to incorporate the new backgrounds, memes, and videos from the `public` directory. The goal is to create a more immersive and memetic user experience that balances a snarky/jokey and serious tone.
    *   **Acceptance Criteria:** The new aesthetic is applied consistently across the application. The look and feel should be heavily influenced by the assets in `public/EBT_MEMES/` and `public/backgrounds/`.
    *   **Files:** `src/app/layout.tsx`, `tailwind.config.js`, `src/app/**/*.tsx`, `public/EBT_MEMES/`, `public/backgrounds/`

*   **Task A2: Integrate Video and Animations.**
    *   **Description:** Incorporate videos and animations from the `public/backgrounds` directory into various pages and components throughout the application flow (excluding the main page video, which will remain as is).
    *   **Acceptance Criteria:** Videos and animations are used to enhance the user experience and reinforce the desired narrative.
    *   **Files:** `src/app/**/*.tsx`, `public/backgrounds/`

### WPC-008-B: Onboarding Flow & Meme Pipeline

*   **Task B1: Create Forced Sharing Modal.**
    *   **Description:** In the `StepSuccess.tsx` component, replace the existing "Share on Twitter" button with a forced modal that appears automatically upon successful application.
    *   **Acceptance Criteria:** A modal appears automatically after an application is successfully submitted. The modal cannot be dismissed until the user has interacted with it (e.g., by clicking a "share" or "close" button).
    *   **Files:** `src/app/apply/components/StepSuccess.tsx`

*   **Task B2: Implement Meme Generation.**
    *   **Description:** In the new forced modal, add functionality to generate a meme for the user. This will involve calling the "nano banana api" with a custom prompt.
    *   **Acceptance Criteria:** A unique meme is generated for the user and displayed in the modal.
    *   **Files:** `src/app/apply/components/StepSuccess.tsx` (or a new modal component)

*   **Task B3: Display Referral Link and Meme.**
    *   **Description:** The forced modal should display the user's referral link and the newly generated meme. It should also include a clear call to action to share on social media.
    *   **Acceptance Criteria:** The modal displays the user's referral link and the generated meme. The user can easily share both on social media.
    *   **Files:** `src/app/apply/components/StepSuccess.tsx` (or a new modal component)

### WPC-008-C: Documentation Update

*   **Task C1: Update `GEMINI.md`.**
    *   **Description:** Update the `GEMINI.md` file to reflect the refined plan.
    *   **Acceptance Criteria:** `GEMINI.md` is updated and provides a clear guide to the current development sprint.
    *   **Files:** `GEMINI.md`

*   **Task C2: Update Project Roadmap.**
    *   **Description:** Update the `.sprint/roadmap.md` file to reflect the refined plan.
    *   **Acceptance Criteria:** The project roadmap reflects the new frontend redesign and meme pipeline features.
    *   **Files:** `.sprint/roadmap.md`
