import time
from os import path
import random

import torch
from torchtext import data
from torchtext import datasets
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import spacy
nlp = spacy.load('en')

from utils import timer, get_valid_input, suppress_stdout


"""
This program must be run using the Anaconda Python (the Python that comes
installed with Anaconda.)

If you need to add that Python to the PATH on Windows, ensure you put it at
the start and not at the end, or it will be overridden by the built-in
Windows Python. Also: Make sure your PATH contains all of the following:
- [anaconda root]\Library\bin
- [anaconda root]\Scripts
- [anaconda root]\

Note: Code in this file is borrowed heavily from
https://github.com/bentrevett/pytorch-sentiment-analysis , a tutorial that I
used for learning how to build RNNs, regular NNs, and other machine learning
techniques using PyTorch.
"""


"""
The FastText model does the following:

- Represent sentences as a bag of words, appending bigrams to the end as their
  own tokens (pairs of consecutive words)
- Convert each token into a numeric representation along multiple dimensions
  (make the word embedding for it)
- Train a linear classifier on those embeddings (logistic regression or SVM).
"""

class FastText(nn.Module):
    def __init__(self, vocab_size, embedding_dim, output_dim, pad_idx):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=pad_idx)
        self.fc = nn.Linear(embedding_dim, output_dim)

    def forward(self, text):
        embedded = self.embedding(text)
        embedded = embedded.permute(1, 0, 2)
        pooled = F.avg_pool2d(embedded, (embedded.shape[1], 1)).squeeze(1)

        return self.fc(pooled)

def _initialize_model():

    # Make the output of this program consistent and reproducible.
    SEED = 1234
    torch.manual_seed(SEED)
    torch.backends.cudnn.deterministic = True

    TEXT = data.Field(tokenize='spacy', preprocessing=_generate_bigrams)
    LABEL = data.LabelField(dtype=torch.float)

    train_data, test_data = datasets.IMDB.splits(TEXT, LABEL)
    train_data, valid_data = train_data.split(random_state = random.seed(SEED))

    MAX_VOCAB_SIZE = 25_000

    TEXT.build_vocab(train_data,
                     max_size=MAX_VOCAB_SIZE,
                     vectors="glove.6B.100d",
                     unk_init=torch.Tensor.normal_)

    LABEL.build_vocab(train_data)

    INPUT_DIM = len(TEXT.vocab)
    EMBEDDING_DIM = 100
    OUTPUT_DIM = 1
    PAD_IDX = TEXT.vocab.stoi[TEXT.pad_token]

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    model = FastText(INPUT_DIM, EMBEDDING_DIM, OUTPUT_DIM, PAD_IDX)

    # Initialize vectors with some useful defaults for text
    pretrained_embeddings = TEXT.vocab.vectors
    model.embedding.weight.data.copy_(pretrained_embeddings)
    UNK_IDX = TEXT.vocab.stoi[TEXT.unk_token]
    model.embedding.weight.data[UNK_IDX] = torch.zeros(EMBEDDING_DIM)
    model.embedding.weight.data[PAD_IDX] = torch.zeros(EMBEDDING_DIM)
    model = model.to(device)

    return model, train_data, valid_data, test_data, device, TEXT


def _generate_bigrams(x):
    n_grams = set(zip(*[x[i:] for i in range(2)]))
    for n_gram in n_grams:
        x.append(' '.join(n_gram))
    return x

def _build_and_store_model():
    """
    Build and store the model in the project directory.
    """

    if path.exists("fast_text_model.pt"):
        print("It looks like you already have a finished/trained model in " +
        "your project directory. Would you like to continue?")
        if get_valid_input(['y', 'n']) == 'n':
            return

    with timer(start_text="Starting build of FastText sentiment model.",
               end_text="\nBuild finished after: {}"):

        def binary_accuracy(preds, y):
            """
            Returns accuracy per batch, i.e. if you get 8/10 right, this returns 0.8, NOT 8
            """

            #round predictions to the closest integer
            rounded_preds = torch.round(torch.sigmoid(preds))
            correct = (rounded_preds == y).float() #convert into float for division
            acc = correct.sum() / len(correct)
            return acc

        def train(model, iterator, optimizer, criterion):

            epoch_loss = 0
            epoch_acc = 0

            model.train()

            for batch in iterator:
                optimizer.zero_grad()

                predictions = model(batch.text).squeeze(1)
                loss = criterion(predictions, batch.label)
                acc = binary_accuracy(predictions, batch.label)
                loss.backward()

                optimizer.step()
                epoch_loss += loss.item()
                epoch_acc += acc.item()

            return epoch_loss / len(iterator), epoch_acc / len(iterator)

        def evaluate(model, iterator, criterion):

            epoch_loss = 0
            epoch_acc = 0

            model.eval()

            with torch.no_grad():
                for batch in iterator:
                    predictions = model(batch.text).squeeze(1)
                    loss = criterion(predictions, batch.label)
                    acc = binary_accuracy(predictions, batch.label)

                    epoch_loss += loss.item()
                    epoch_acc += acc.item()

            return epoch_loss / len(iterator), epoch_acc / len(iterator)

        def epoch_time(start_time, end_time):
            elapsed_time = end_time - start_time
            elapsed_mins = int(elapsed_time / 60)
            elapsed_secs = int(elapsed_time - (elapsed_mins * 60))
            return elapsed_mins, elapsed_secs

        model, train_data, valid_data, test_data, device, TEXT = _initialize_model()

        BATCH_SIZE = 64
        train_iterator, valid_iterator, test_iterator = data.BucketIterator.splits(
            (train_data, valid_data, test_data),
            batch_size=BATCH_SIZE,
            device=device
        )

        optimizer = optim.Adam(model.parameters())
        criterion = nn.BCEWithLogitsLoss()
        criterion = criterion.to(device)

        N_EPOCHS = 5

        best_valid_loss = float('inf')

        for epoch in range(N_EPOCHS):

            start_time = time.time()

            train_loss, train_acc = train(model, train_iterator, optimizer, criterion)
            valid_loss, valid_acc = evaluate(model, valid_iterator, criterion)

            end_time = time.time()

            epoch_mins, epoch_secs = epoch_time(start_time, end_time)

            if valid_loss < best_valid_loss:
                best_valid_loss = valid_loss
                torch.save(model, 'fast_text_model.pt')
                torch.save(TEXT, 'model_text_field.v')

            print(f'Epoch: {epoch+1:02} | Epoch Time: {epoch_mins}m {epoch_secs}s')
            print(f'\tTrain Loss: {train_loss:.3f} | Train Acc: {train_acc*100:.2f}%')
            print(f'\t Val. Loss: {valid_loss:.3f} |  Val. Acc: {valid_acc*100:.2f}%')

        test_loss, test_acc = evaluate(model, test_iterator, criterion)
        print(f'Test Loss: {test_loss:.3f} | Test Acc: {test_acc*100:.2f}%')

class SentimentPredictor():
    """
    Create an instance of this class to load the model and call
    predict_sentiment to predict the sentiment of a string.
    """
    def __init__(self):

        MODEL_PATH = "fast_text_model.pt"
        VOCAB_PATH = "model_text_field.v"

        if not (path.exists(MODEL_PATH) and path.exists(VOCAB_PATH)):
            raise Exception("Model or vocabulary pickle not found. You must build the model before calling predict_sentiment.")

        # TODO: Fix this, this currently fails to suppress warnings (aka does nothing)
        with suppress_stdout(): # suppress warnings that I don't care about
            self.model = torch.load('fast_text_model.pt')
            self.TEXT = torch.load('model_text_field.v')
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.eval()

    def predict_sentiment(self, input_string):
        """
        Predict the sentiment of the input string.
        """
        tokenized = _generate_bigrams([tok.text for tok in nlp.tokenizer(input_string)])
        indexed = [self.TEXT.vocab.stoi[t] for t in tokenized]
        tensor = torch.LongTensor(indexed).to(self.device)
        tensor = tensor.unsqueeze(1)
        prediction = torch.sigmoid(self.model(tensor))
        sentiment_score = prediction.item()
        return sentiment_score


def convert_sentiment_score_to_prediction(sentiment_score):
    """
    Converts a sentiment_score returned from our machine learning model into
    a human-comprehensible text prediction ("Positive" or "Negative" sentiment)
    and a confidence percent score, where 100% is maximum confident in the
    prediction, and 0% is not at all confident in the prediction.
    """
    if sentiment_score > .5:
        prediction = "Positive"
        sentiment_score = 1 - sentiment_score
    else:
        prediction = "Negative"
    confidence_percent = (.5 - sentiment_score) * 200
    return prediction, confidence_percent
