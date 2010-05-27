require 'rake/packagetask'

def version
  @version ||= File.open('VERSION', 'r') { |f| f.read.chomp }
  @version
end

def version_bump ind
  print "#{version} => "

  v = version.split '.'
  v[ind] = v[ind].to_i + 1
  File.open('VERSION', 'w') { |f| f.write(v.join '.') }

  @version = nil
  puts version
end

desc 'minifies protobox js and css'
task :minify => ['minify:js', 'minify:css']
namespace :minify do
  desc 'minifies protobox.js'
  task :js do
    puts 'Compressing js...'
    `java -jar yuicompressor-2.4.2.jar --type js -o protobox/protobox.min.js protobox/protobox.js`
  end

  desc 'minifies protobox.css'
  task :css do
    puts 'Compressing css...'
    `java -jar yuicompressor-2.4.2.jar --type css -o protobox/protobox.min.css protobox/protobox.css`
  end
end

desc 'displays current version'
task :version do
  puts version
end
namespace :version do
  desc 'bump the minor version number'
  task :bump => 'bump:minor'

  namespace :bump do

    desc 'bump the patch version number'
    task :patch do
      version_bump 2
    end

    desc 'bump the minor version number'
    task :minor do
      version_bump 1
    end

    desc 'bump the major version number'
    task :major do
      version_bump 0
    end
  end
end

desc 'minfies the js and css, then creates .zip and .tar.gz archives for release'
task :package => :minify 
Rake::PackageTask.new'protobox', version do |t|
  t.need_tar_gz = true
  t.need_zip = true
  t.package_files.include('protobox/protobox*',
                          'protobox/images/protobox/*.*')
end


