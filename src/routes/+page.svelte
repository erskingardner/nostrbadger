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

    const privateKey = generatePrivateKey();
    const pubkey = getPublicKey(privateKey);

    const signer = new NDKPrivateKeySigner(privateKey);
    ndk.signer = signer;

    const questions = ndk.storeSubscribe(
        { kinds: [NDKKind.Text], "#t": ["hb2023askNostr"] },
        { closeOnEose: false }
    );

    const upvotes = ndk.storeSubscribe(
        { kinds: [NDKKind.Reaction], "#t": ["hb2023askNostr"] },
        { closeOnEose: false }
    );

    async function publishQuestion(event: any) {
        const formData = new FormData(event.target);

        const question = new NDKEvent(ndk, {
            kind: NDKKind.Text,
            created_at: Math.floor(new Date().getTime() / 1000),
            content: formData.get("question") as string,
            tags: [["t", "hb2023askNostr"]],
            pubkey: pubkey,
        });

        await question.publish();
        event.target.reset();
    }

    async function upvoteQuestion(questionId: string) {
        const upvote = new NDKEvent(ndk, {
            kind: NDKKind.Text,
            created_at: Math.floor(new Date().getTime() / 1000),
            content: "+",
            tags: [
                ["t", "hb2023askNostr"],
                ["e", questionId],
            ],
            pubkey: pubkey,
        });

        await upvote.publish();
    }

    onDestroy(() => {
        questions.unsubscribe();
        upvotes.unsubscribe();
    });

    $: {
        $questions = $questions.sort((a, b) => {
            const aLikeCount = $upvotes.filter(
                (upvote) =>
                    upvote.getMatchingTags("e").length > 0 &&
                    upvote.getMatchingTags("e")[0][1] === a.id
            ).length;
            const bLikeCount = $upvotes.filter(
                (upvote) =>
                    upvote.getMatchingTags("e").length > 0 &&
                    upvote.getMatchingTags("e")[0][1] === b.id
            ).length;

            return bLikeCount - aLikeCount;
        });
    }
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
                    <button on:click={() => upvoteQuestion(question.id)} class="upvoteButton">
                        <ArrowBigUp strokeWidth="0.75" size="64" />
                        <span class="upvoteCount">
                            {$upvotes.filter(
                                (upvote) =>
                                    upvote.getMatchingTags("e").length > 0 &&
                                    upvote.getMatchingTags("e")[0][1] === question.id
                            ).length}
                        </span>
                    </button>
                </div>
                <div>{question.content}</div>
            </div>
        {/each}
    {:else}
        <p class="waitingMessage">Waiting for questions...</p>
    {/if}
</div>
