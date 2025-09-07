# Web App Features for Storybook Reading

1. User Image Upload
   Users can upload their own image.
2. User Age and Gender Input
   Users provide their age and gender information.
3. Optional Voice Upload
   Users can upload a voice file to be used for narration (optional).
4. Personalized Story Generation using Gemini pro 2.5
   The system generates a fairy tale with the user as the main character, adapting the story to the user’s age and gender. Both images and text for the story are generated separately.
5. Background Music Generation from Images
   The app analyzes the generated images and creates suitable background music.
6. Read-Aloud Playback
   When the “Read” button is clicked, the app plays the narration voice (either uploaded, it should be generated via Elevenlabs API and played) along with the background music.
