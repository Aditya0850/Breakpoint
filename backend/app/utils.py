import spacy

nlp = spacy.load('en_core_web_sm')

def count_filler_words(text: str) -> dict:

    pure_fillers = {"um", "uh", "hmm"}
    tricky_fillers = {"like", "so", "basically", "literally"}

    found = {}
    total = 0

    doc = nlp(text.lower())

    for token in doc:

        word = token.text

        if word in pure_fillers:
            found[word] = found.get(word, 0) + 1
            total += 1

        elif word in tricky_fillers:

            if token.pos_ not in ["VERB", "NOUN", "PROPN"]:
                found[word] = found.get(word, 0) + 1
                total += 1

    return {"details": found, "total_increment": total}
