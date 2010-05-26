#!/usr/bin/ruby

require 'webrick'
include WEBrick

s = HTTPServer.new :Port => 2000, :DocumentRoot => Dir::pwd
s.mount "", HTTPServlet::FileHandler, '.', true
trap('INT') { s.shutdown }
s.start
