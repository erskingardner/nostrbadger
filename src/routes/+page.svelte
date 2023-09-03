<script lang="ts">
    import NDKSvelte from "@nostr-dev-kit/ndk-svelte";
    import { NDKEvent, NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
    import { generatePrivateKey, getPublicKey } from "nostr-tools";
    import { ArrowBigUp } from "lucide-svelte";
    import { onDestroy } from "svelte";

    const ndk = new NDKSvelte({
        explicitRelayUrls: [
            "wss://relay.damus.io",
            "wss://relay.snort.social",
            "wss://nos.lol",
            "wss://relay.nostr.band",
        ],
    });

    ndk.connect();

    const questions = ndk.storeSubscribe(
        { kinds: [NDKKind.Text], "#t": ["hb2023askNostr"] },
        { closeOnEose: false }
    );
</script>

<h1 class="title">Ask NostrBadger</h1>

<form on:submit|preventDefault={publishQuestion}>
    <textarea name="question" placeholder="What is your question? " />
    <button type="submit" class="primaryButton">Submit</button>
</form>
<div class="questionContainer">
    {#if $questions.length > 0}
        {#each $questions as question (question.id)}
            <div class="question">
                <div class="question-meta">
                    <img
                        src="https://robohash.org/{question.pubkey}?set=set1&size=64x64"
                        alt="avatar"
                        class="avatar"
                    />
                </div>
                <div>{question.content}</div>
            </div>
        {/each}
    {:else}
        <p class="waitingMessage">Waiting for questions...</p>
    {/if}
</div>
