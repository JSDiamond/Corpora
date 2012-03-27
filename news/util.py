from BeautifulSoup import BeautifulSoup
import re
import urllib2
import codecs
import json


def write_hello():
    return "hello"


def get_google():
    url = "http://news.google.com/news?output=rss"
    groupedData = list();
    
    
    f = urllib2.urlopen(url).read()
    soup = BeautifulSoup(f)
    titles = soup.findAll('title');
    titles = titles[2:]
    descripts = soup.findAll('description')
    descripts = descripts[:-1]
    
    
    for idx, script in enumerate(descripts):
        paird = list();
        urlSrch = re.findall(r"url=+\S*&quot", str(script))
        urlSrch = [link[4:-5] for link in urlSrch]
        for link in urlSrch:
            pubSrch = re.search(r"\/\/+\S*.", link)
            if  pubSrch:
                if "www" in pubSrch.group():
                    pubName = pubSrch.group()[6:-2]
                else:
                    pubName = pubSrch.group()[2:-2]
                #print pubName
                paird.append((pubName, link))
        #print len(urlSrch)
        trimTitle = str(titles[idx])
        trimTitle = trimTitle[7:-8]
        groupedData.append((trimTitle, paird))
    
    return groupedData