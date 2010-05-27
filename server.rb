#!/usr/bin/ruby

require 'webrick'
include WEBrick

puts 'starting server...'
s = HTTPServer.new :Port => 2000, :DocumentRoot => Dir::pwd
s.mount "", HTTPServlet::FileHandler, '.', true
trap('INT') { s.shutdown }
puts 'press ctrl-c to shut down'
s.start
