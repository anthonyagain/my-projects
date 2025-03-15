import tensorflow as tf
from tensorflow.examples.tutorials.mnist import input_data
from tensorflow.python.ops import rnn, rnn_cell
mnist = input_data.read_data_sets("/tmp/data/", one_hot = True)

hm_epochs = 3
n_classes = 10
batch_size = 128
row_length = 28
num_rows = 28
rnn_size = 128

print("START")
print("----------------------------------------")

# Creates an empty matrix for the input data. This is size ? by 28 by 28 -
# images are 28x28 pixels, and the # of images per batch can vary.
x = tf.placeholder('float', [None, num_rows, row_length])
# Creates an empty matrix of undefined size
y = tf.placeholder('float')

def recurrent_neural_network(x):
    # Create a dict with weights being a 2 dimensional matrix of random values
    # with size 128 by 10, and biases being a 1 dimensional matrix of random
    # values with size 10
    layer = {'weights':tf.Variable(tf.random_normal([rnn_size, n_classes])),
                      'biases':tf.Variable(tf.random_normal([n_classes]))}

    # Transpose the matrix by swapping the z and y planes/sizes. (? x 28 x 28) --> (28 x ? x 28)
    x = tf.transpose(x, [1, 0, 2])
    # Fill the values of the matrix chronologically into a new arbitrary shape with same area
    # (-1 calculates that amount for you, using the same area as before)
    # After this, we have a long list of rows, in order of:
    # - 1st row of 1st object
    # - 1st row of 2nd object
    # - ...
    # - 1st row of Nth object
    # - 2nd row of 1st object
    # - ...
    # - 28th row of Nth object
    x = tf.reshape(x, [-1, row_length])
    # Divide the above list of rows into 28 pieces - so the first piece contains
    # all of the 1st rows, 2nd piece contains all of the 2nd rows, etc.
    x = tf.split(x, num_rows, 0)

    lstm_cell = rnn_cell.BasicLSTMCell(rnn_size, state_is_tuple=True)
    # Thus, the x that static_rnn accepts is a list of Tensors, where
    # each Tensor contains a list of data points at a single point of time.
    # So, list of Tensors L with each Tensor t, where L[t][0] is a single data point
    # at a single point in time, L[t][1] is an irrelevant data point at the same
    # (first) point in time, and L[t + 1][0] is the 2nd data point after L[t][0]
    # whose value is correlated with the 1st data point.
    outputs, states = rnn.static_rnn(lstm_cell, x, dtype=tf.float32)

    # outputs is a list of 28 Tensors, each with shape (?, 128) - an unknown
    # length list of 128 floats.

    # factor in the weights and biases - idk why we take outputs[-1]
    output = tf.matmul(outputs[-1], layer['weights']) + layer['biases']

    # somehow output is now a shape=(?, 10) Tensor. How? No idea
    return output

def train_neural_network(x):
    # define how the prediction is calculated in our graph.
    prediction = recurrent_neural_network(x)

    # softmax_cross_entropy_with_logits does a few things.
    # first, softmax: This normalizes each element in the vector/matrix so
    # that the elements sum to 1. Thus, each element can be interpreted as a
    # probability.
    # second, it calculates cross_entropy, which is a loss function. each
    # element in the data corresponds to a single training instance, and
    # it compares the guessed probability to the actual answer, and calculates
    # a loss for each problem.
    # finally, here, we take the average of all losses for all data using
    # reduce_mean, and then in the following line we tell AdamOptimizer to
    # minimize the total cost.
    cost = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=prediction, labels=y))
    optimizer = tf.train.AdamOptimizer().minimize(cost)

    with tf.Session() as sess:
        sess.run(tf.global_variables_initializer())

        # Loop over the number of epochs we want to do. One epoch is one instance of the training data.
        for epoch in range(hm_epochs):
            epoch_loss = 0
        #    # Separate the training data into batches so it doesn't all get loaded into memory at once.
            for _ in range(int(mnist.train.num_examples/batch_size)):
                epoch_x, epoch_y = mnist.train.next_batch(batch_size)

                # Convert the flattened shape into 28x28 cubes, the way the pictures were originally formatted.
                # This creates a 3 dimensional matrix of size 128, meaning the highest level array has 128 objects in it,
                # and each of those objects is made up of 28 rows of length 28.
                # [
                # [[object 1   row 1 of 28], [object 1   row 2 of 28], ...],
                # [[object 2   row 1 of 28], [object 2   row 2 of 28], ...],
                # ...
                # [[object 128 row 1 of 28], [object 128 row 2 of 28], ...],
                # ]
                epoch_x = epoch_x.reshape((batch_size, num_rows, row_length))

                # Run the graph using the optimizer, cost, and training data.
                # X is inputs, and y is answer key (I think?)
                # I think this is setting the values of x and y placeholders above.
                _, c = sess.run([optimizer, cost], feed_dict={x: epoch_x, y: epoch_y})
                # c is the loss for each batch - we want to add them up to
                # calculate total loss for full training data
                epoch_loss += c

            print('Epoch', epoch, 'completed out of', hm_epochs,'loss:', epoch_loss)

        # Creates a big, flat matrix, full of True or False values - these
        # are the questions that we got right and wrong
        
        # tf.argmax takes the highest number in the array - each element is a
        # probably of that selection being the right answer. Then, it checks if
        # the selection with the highest probability is actually equal to the
        # right answer - creates an array of true/false values.
        correct = tf.equal(tf.argmax(prediction, 1), tf.argmax(y, 1))

        # Convert True/False array created above to 1 and 0 and calculate the
        # average to tell us what % we got right/wrong
        accuracy = tf.reduce_mean(tf.cast(correct, 'float'))
        print('Accuracy:', accuracy.eval({x:mnist.test.images.reshape((-1, num_rows, row_length)), y:mnist.test.labels}))

train_neural_network(x)
