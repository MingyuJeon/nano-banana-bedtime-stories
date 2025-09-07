## Voice Clone

유저가 음성 파일 업로드하면, 해당 음성을 복제

### Request

```ts
// example.mts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
import * as fs from "fs";

const elevenlabs = new ElevenLabsClient();

const voice = await elevenlabs.voices.ivc.create({
  name: "My Voice Clone",
  // Replace with the paths to your audio files.
  // The more files you add, the better the clone will be.
  files: [fs.createReadStream("/path/to/your/audio/file.mp3")],
});

console.log(voice.voiceId);
```

### Response

```json
{
  "voice_id": "c38kUX8pkfYO2kHyqfFy",
  "requires_verification": false
}
```

---

## List voices

유저가 업로드 했던 음성들을 확인할 수 있음

### Request

```ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({ apiKey: "YOUR_API_KEY" });
await client.voices.search({
  includeTotalCount: true,
});
```

### Response

```json
{
  "voices": [
    {
      "voice_id": "string",
      "name": "string",
      "samples": [
        {
          "sample_id": "string",
          "file_name": "string",
          "mime_type": "string",
          "size_bytes": 1,
          "hash": "string",
          "duration_secs": 1.1,
          "remove_background_noise": true,
          "has_isolated_audio": true,
          "has_isolated_audio_preview": true,
          "speaker_separation": {
            "voice_id": "string",
            "sample_id": "string",
            "status": "not_started",
            "speakers": {},
            "selected_speaker_ids": ["string"]
          },
          "trim_start": 1,
          "trim_end": 1
        }
      ],
      "category": "generated",
      "fine_tuning": {
        "is_allowed_to_fine_tune": true,
        "state": {},
        "verification_failures": ["string"],
        "verification_attempts_count": 1,
        "manual_verification_requested": true,
        "language": "string",
        "progress": {},
        "message": {},
        "dataset_duration_seconds": 1.1,
        "verification_attempts": [
          {
            "text": "string",
            "date_unix": 1,
            "accepted": true,
            "similarity": 1.1,
            "levenshtein_distance": 1.1,
            "recording": {
              "recording_id": "string",
              "mime_type": "string",
              "size_bytes": 1,
              "upload_date_unix": 1,
              "transcription": "string"
            }
          }
        ],
        "slice_ids": ["string"],
        "manual_verification": {
          "extra_text": "string",
          "request_time_unix": 1,
          "files": [
            {
              "file_id": "string",
              "file_name": "string",
              "mime_type": "string",
              "size_bytes": 1,
              "upload_date_unix": 1
            }
          ]
        },
        "max_verification_attempts": 1,
        "next_max_verification_attempts_reset_unix_ms": 1,
        "finetuning_state": null
      },
      "labels": {},
      "description": "string",
      "preview_url": "string",
      "available_for_tiers": ["string"],
      "settings": {
        "stability": 1.1,
        "use_speaker_boost": true,
        "similarity_boost": 1.1,
        "style": 1.1,
        "speed": 1.1
      },
      "sharing": {
        "status": "enabled",
        "history_item_sample_id": "string",
        "date_unix": 1,
        "whitelisted_emails": ["string"],
        "public_owner_id": "string",
        "original_voice_id": "string",
        "financial_rewards_enabled": true,
        "free_users_allowed": true,
        "live_moderation_enabled": true,
        "rate": 1.1,
        "fiat_rate": 1.1,
        "notice_period": 1,
        "disable_at_unix": 1,
        "voice_mixing_allowed": true,
        "featured": true,
        "category": "generated",
        "reader_app_enabled": true,
        "image_url": "string",
        "ban_reason": "string",
        "liked_by_count": 1,
        "cloned_by_count": 1,
        "name": "string",
        "description": "string",
        "labels": {},
        "review_status": "not_requested",
        "review_message": "string",
        "enabled_in_library": true,
        "instagram_username": "string",
        "twitter_username": "string",
        "youtube_username": "string",
        "tiktok_username": "string",
        "moderation_check": {
          "date_checked_unix": 1,
          "name_value": "string",
          "name_check": true,
          "description_value": "string",
          "description_check": true,
          "sample_ids": ["string"],
          "sample_checks": [1.1],
          "captcha_ids": ["string"],
          "captcha_checks": [1.1]
        },
        "reader_restricted_on": [
          {
            "resource_type": "read",
            "resource_id": "string"
          }
        ]
      },
      "high_quality_base_model_ids": ["string"],
      "verified_languages": [
        {
          "language": "string",
          "model_id": "string",
          "accent": "string",
          "locale": "string",
          "preview_url": "string"
        }
      ],
      "safety_control": "NONE",
      "voice_verification": {
        "requires_verification": true,
        "is_verified": true,
        "verification_failures": ["string"],
        "verification_attempts_count": 1,
        "language": "string",
        "verification_attempts": [
          {
            "text": "string",
            "date_unix": 1,
            "accepted": true,
            "similarity": 1.1,
            "levenshtein_distance": 1.1,
            "recording": {
              "recording_id": "string",
              "mime_type": "string",
              "size_bytes": 1,
              "upload_date_unix": 1,
              "transcription": "string"
            }
          }
        ]
      },
      "permission_on_resource": "string",
      "is_owner": true,
      "is_legacy": false,
      "is_mixed": false,
      "favorited_at_unix": 1,
      "created_at_unix": 1
    }
  ],
  "has_more": true,
  "total_count": 1,
  "next_page_token": "string"
}
```

---

## Get voice

유저가 특정 음성을 선택하면 voice id를 돌려줌

### Request

```ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({ apiKey: "YOUR_API_KEY" });
await client.voices.get("21m00Tcm4TlvDq8ikWAM");
```

### Response

```json
{
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "name": "Rachel",
  "category": "professional",
  "fine_tuning": {
    "is_allowed_to_fine_tune": true,
    "state": {
      "eleven_multilingual_v2": "fine_tuned"
    },
    "verification_failures": [],
    "verification_attempts_count": 2,
    "manual_verification_requested": false
  },
  "labels": {
    "accent": "American",
    "age": "middle-aged",
    "description": "expressive",
    "gender": "female",
    "use_case": "social media"
  },
  "description": "A warm, expressive voice with a touch of humor.",
  "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/9BWtsMINqrJLrRacOk9x/405766b8-1f4e-4d3c-aba1-6f25333823ec.mp3",
  "available_for_tiers": ["creator", "enterprise"],
  "settings": {
    "stability": 1,
    "use_speaker_boost": true,
    "similarity_boost": 1,
    "style": 0,
    "speed": 1
  },
  "sharing": {
    "status": "enabled",
    "history_item_sample_id": "DCwhRBWXzGAHq8TQ4Fs18",
    "date_unix": 1714204800,
    "whitelisted_emails": ["example@example.com"],
    "public_owner_id": "DCwhRBWXzGAHq8TQ4Fs18",
    "original_voice_id": "DCwhRBWXzGAHq8TQ4Fs18",
    "financial_rewards_enabled": true,
    "free_users_allowed": true,
    "live_moderation_enabled": true,
    "rate": 0.05,
    "notice_period": 30,
    "disable_at_unix": 1714204800,
    "voice_mixing_allowed": false,
    "featured": true,
    "category": "professional",
    "reader_app_enabled": true,
    "liked_by_count": 100,
    "cloned_by_count": 50,
    "name": "Rachel",
    "description": "A female voice with a soft and friendly tone.",
    "labels": {
      "accent": "American",
      "gender": "female"
    },
    "review_status": "allowed",
    "enabled_in_library": true,
    "moderation_check": {
      "date_checked_unix": 1714204800,
      "name_value": "Rachel",
      "name_check": true,
      "description_value": "A female voice with a soft and friendly tone.",
      "description_check": true,
      "sample_ids": ["sample1", "sample2"],
      "sample_checks": [0.95, 0.98],
      "captcha_ids": ["captcha1", "captcha2"],
      "captcha_checks": [0.95, 0.98]
    },
    "reader_restricted_on": [
      {
        "resource_type": "read",
        "resource_id": "FCwhRBWXzGAHq8TQ4Fs18"
      }
    ]
  },
  "high_quality_base_model_ids": [
    "eleven_v2_flash",
    "eleven_flash_v2",
    "eleven_turbo_v2_5",
    "eleven_multilingual_v2",
    "eleven_v2_5_flash",
    "eleven_flash_v2_5",
    "eleven_turbo_v2"
  ],
  "verified_languages": [
    {
      "language": "en",
      "model_id": "eleven_multilingual_v2",
      "accent": "american",
      "locale": "en-US",
      "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/9BWtsMINqrJLrRacOk9x/405766b8-1f4e-4d3c-aba1-6f25333823ec.mp3"
    }
  ],
  "voice_verification": {
    "requires_verification": false,
    "is_verified": true,
    "verification_failures": [],
    "verification_attempts_count": 0,
    "language": "en",
    "verification_attempts": [
      {
        "text": "Hello, how are you?",
        "date_unix": 1714204800,
        "accepted": true,
        "similarity": 0.95,
        "levenshtein_distance": 2,
        "recording": {
          "recording_id": "CwhRBWXzGAHq8TQ4Fs17",
          "mime_type": "audio/mpeg",
          "size_bytes": 1000000,
          "upload_date_unix": 1714204800,
          "transcription": "Hello, how are you?"
        }
      }
    ]
  },
  "is_owner": false,
  "is_legacy": false,
  "is_mixed": false
}
```

## Create Speech

voice id를 이용해서 동화책을 읽음

```ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({ apiKey: "YOUR_API_KEY" });
await client.textToSpeech.convert(`${voice_id}`, {
  outputFormat: `${mp3_date}`,
  text: "The first move is what sets everything in motion.",
  modelId: "eleven_multilingual_v2",
});
```
