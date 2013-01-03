#!/usr/bin/python

from HTMLParser import HTMLParser
import sys

class WystapienieHTMLParser(HTMLParser):
    """
    Extracts main text out of HTML pages downloaded from http://sejmometr.pl/sejm_wystapienia/#id (#id=some number).
    """
    divcounter  = 0
    text        = "NoTextFound!"
    textfound   = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        #print "Encountered a start tag:", tag," -> ", attrs        
        if tag=="div" and attrs.get("class", "")=="_obj_main_div" and attrs.get("id", "")=="main_doc_cont":
            #print "Starting point found!"
            self.divcounter  = 0
            self.textfound   = True
            self.text        = ""
        if tag=="div": self.divcounter = self.divcounter + 1
        

    def handle_endtag(self, tag):
        #print "Encountered an end tag :", tag
        if tag=="div": self.divcounter = self.divcounter - 1
        if tag=="div" and self.textfound and self.divcounter<=0: 
            #print "Ending point found!"
            self.textfound = False
        

    def handle_data(self, data):
        #print "Encountered some data  :", data[:50]+"..."
        if self.textfound: self.text = self.text + data


if __name__=="__main__":

    try:
        # read HTML code
        htmlcode = sys.stdin.read()   
    
        if len(htmlcode)<5: 
            raise KeyboardInterrupt()

        # instantiate the parser and fed it some HTML
        parser = WystapienieHTMLParser()
        parser.feed(htmlcode)

        # print extracted text
        txt = parser.text        
        print txt.replace("\n"," ").strip()

    except KeyboardInterrupt:
        sys.stderr.write("###############################################################################\n");
        sys.stderr.write("The script reads from standard input source HTML-file (wystapienie) to be parsed and\n")    
        sys.stderr.write("prints to standard output text extracted out of <div id=main_doc_cont class=_obj_main_div>.\n")
        sys.stderr.write("###############################################################################\n");

