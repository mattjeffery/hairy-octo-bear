from ConfigParser import SafeConfigParser
import argparse
import csv
import logging
from pymongo import MongoClient
import pymongo


def main():

    pass


if __name__ == "__main__":
    # Parse the command line for options/configurations
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config', type=str, help='config path')
    parser.add_argument('infile', type=argparse.FileType('r'), help='input file path')
    options = parser.parse_args()

    FORMAT = '%(asctime)-15s %(levelname)s %(message)s'
    logging.basicConfig(format=FORMAT, level=logging.INFO)

    # read the config file
    config = SafeConfigParser()
    config.read([options.config])

    mongo_uri = config.get('mongo', 'uri')
    mongo_db = mongo_uri.rsplit('/', 1)[-1]

    mongo = MongoClient(mongo_uri)
    db = mongo[mongo_db]
    charts = db['charts']
    charts.remove()

    for line in options.infile:
        key, value = line.split('\t', 1)
        charts.insert({"key": key, "value": value})

    charts.ensure_index("key")