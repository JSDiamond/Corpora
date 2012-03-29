from BeautifulSoup import BeautifulSoup
from urlparse import urlparse
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
            netloca = urlparse(link)
            if "www" in netloca.netloc:
                pubName = netloca.netloc[4:]
            else:
                pubName = netloca.netloc
            paird.append((pubName, link))
        trimTitle = str(titles[idx])
        trimTitle = trimTitle[7:-8]
        groupedData.append((trimTitle, paird))
    
    return groupedData