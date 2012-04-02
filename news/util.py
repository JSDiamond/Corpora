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
    groupedData = list()
    masterLinks = list()
    
    f = urllib2.urlopen(url).read()
    soup = BeautifulSoup(f)
    titles = soup.findAll('title');
    titles = titles[2:]
    items = soup.findAll('item')
    descripts = soup.findAll('description')
    descripts = descripts[:-1]
    
    
    for idx, itm in enumerate(items):
        paird = list();
        masterlink = re.findall(r"k />+\S*<g", str(itm))
        masterlink = re.findall(r"url=+\S*<g", str(masterlink))
        masterlink = [link[4:-2] for link in masterlink]
        masterLinks.append(masterlink[0])
        descript = itm.find('description')
        urlSrch = re.findall(r"url=+\S*&quot", str(descript))
        urlSrch = [link[4:-5] for link in urlSrch]
        for link in urlSrch:
            netloca = urlparse(link)
            if "hostednews/ap/"in link:
                pubName = "associatedpress"
            else:
                if "www" in netloca.netloc:
                    pubName = netloca.netloc[4:]
                else:
                    pubName = netloca.netloc
            paird.append((pubName, link))
        trimTitle = str(titles[idx])
        trimTitle = trimTitle[7:-8]
        #get rid of Publisher name after the dash
        cutPub = re.findall(r"\s-\s+.{5}", trimTitle)
        cropmark = trimTitle.find(cutPub[len(cutPub)-1]);
        trimTitle = trimTitle[:cropmark]
        groupedData.append((trimTitle, paird))
        
        
    GScrapeData = {"Masters": masterLinks, "Stories": groupedData}        
    JSON_output = json.dumps( GScrapeData )#this does not work for parsing in Views 
    return GScrapeData
    #return JSON_output


