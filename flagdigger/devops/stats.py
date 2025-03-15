import statistics
from collections import defaultdict

def time_string_to_ms(time_string):
    hours, minutes, seconds, milliseconds = time_string.split(":")

    return (int(milliseconds)) + (int(seconds) * 1000) + (int(minutes) * 60 * 1000) + (int(hours) * 60 * 60 * 1000)

    timedelta_obj = timedelta(hours=int(hours), minutes=int(minutes), seconds=int(seconds), milliseconds=int(milliseconds))

def main():
    """

    """

    event_lengths = defaultdict(lambda: [])

    with open("devops/flagdigger-out5.log", 'r') as file_io:

        startFrameTime = None
        sleepStartTime = None
        line_nbr = 0

        line = file_io.readline()
        while line:
            if "startingFrame" in line:
                line = line.split()
                startFrameTime = time_string_to_ms(line[1])
            if "endingFrame" in line:
                print("frame compute took: {}".format(time_string_to_ms(line.split()[1]) - startFrameTime))
            if "numFixtures" in line:
                print("num fixtures: {}".format(line.split()[1]))
            if "startingSleep" in line:
                sleepStartTime = time_string_to_ms(line.split()[1])
            if "endingSleep" in line and sleepStartTime:
                print("slept for: {}".format(time_string_to_ms(line.split()[1]) - sleepStartTime))
                print("total frame time with sleep: {}".format(time_string_to_ms(line.split()[1]) - startFrameTime))

            line = file_io.readline()
            line_nbr += 1

    """
    for event_name in event_lengths.keys():
        times = event_lengths[event_name]
        print("{} info:".format(event_name))
        print("max: {}, min: {}, avg: {:.3}, median: {}, count: {}, std_dev: {:3.3}".format(
            max(times),
            min(times),
            sum(times) / len(times),
            statistics.median(times),
            len(times),
            statistics.stdev(times)
        ))
    """
main()
