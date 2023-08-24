<script lang="ts">
    import NDKSvelte from "@nostr-dev-kit/ndk-svelte";
    import { NDKEvent, NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
    import { generatePrivateKey, getPublicKey } from "nostr-tools";
    import { ArrowBigUp } from "lucide-svelte";

    const ndk = new NDKSvelte({
        explicitRelayUrls: [
            "wss://nos.lol",
            "wss://relay.snort.social",
            "wss://relay.damus.io",
            "wss://relay.nostr.band",
        ],
    });

    ndk.connect()
        .then(() => console.log("NDK Connected"))
        .catch(() => console.log("NDK connection failed"));

    // Generate a new identity
    const privateKey = generatePrivateKey();
    const pubkey = getPublicKey(privateKey);

    // Set up the signer
    const signer = new NDKPrivateKeySigner(privateKey);
    ndk.signer = signer;

    // Set up a subscription to fetch events
    const questions = ndk.storeSubscribe(
        { kinds: [NDKKind.Text], "#t": ["bh2023askNostrTesting"] },
        { autoStart: true, closeOnEose: false }
    );

    // Set up a subscription to fetch upvotes
    const upvotes = ndk.storeSubscribe(
        { kinds: [NDKKind.Reaction], "#t": ["bh2023askNostrTesting"] },
        { autoStart: true, closeOnEose: false }
    );

    // Publish a question event
    function publishQuestion(event: any): void {
        const formData = new FormData(event.target);

        const question = new NDKEvent(ndk, {
            kind: NDKKind.Text,
            pubkey: pubkey,
            content: formData.get("question") as string,
            created_at: Math.floor(new Date().getTime() / 1000),
            tags: [["t", "bh2023askNostrTesting"]],
        });

        question
            .publish()
            .then(() => event.target.reset())
            .catch((error) => {
                console.error(error);
            });
    }

    // Publish upvote (reaction) events
    function upvoteQuestion(questionId: string): void {
        const upvote = new NDKEvent(ndk, {
            kind: NDKKind.Reaction,
            pubkey: pubkey,
            content: "+",
            created_at: Math.floor(new Date().getTime() / 1000),
            tags: [
                ["t", "bh2023askNostrTesting"],
                ["e", questionId],
            ],
        });

        upvote.publish().catch((error) => {
            console.error(error);
        });
    }

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
    <textarea name="question" placeholder="What would you like to ask?" required />
    <button class="primaryButton" type="submit">Submit</button>
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
