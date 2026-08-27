## Summary

When onboarding, there are different states that the user can be in, for a given project.

This is enumerated in the `OnboardingChatState` enum in `src/types/onboarding/main.ts`.

## Onboarding Chat State = `INITIAL`

This is the initial state of the onboarding chat, where the user has zero documents in the project.

They are requested to upload a document immediately.

## Onboarding Chat State = `NO_VALID_DOCUMENTS`

This is the state where the user has uploaded a document, but it is not valid.

This is the case where there may be one or more excel sheets in the uploaded files,
but none of them are valid financial statements.

In this case, the user is informed that their data is saved, but they
need to upload a valid financial statement.

## Onboarding Chat State = `PROJECT_TYPE`

This is the state where the user is asked to select the type of project they are building.

This is the case where there may be one or more excel sheets in the uploaded files,
but none of them are valid financial statements.

In this case, the user is informed that their data is saved, but they
need to upload a valid financial statement.