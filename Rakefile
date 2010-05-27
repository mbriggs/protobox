require 'rake/packagetask'

def version
  @version ||= File.open('VERSION').read.chomp
  @version
end

task :minify => ['minify:js', 'minify:css']
namespace :minify do
  task :js do
    `java -jar yuicompressor-2.4.2.jar --type js -o protobox/protobox.min.js protobox/protobox.js`
  end
  task :css do
    `java -jar yuicompressor-2.4.2.jar --type css -o protobox/protobox.min.css protobox/protobox.css`
  end
end

task :package => :minify
Rake::PackageTask.new'protobox', version do |t|
  t.need_tar_gz = true
  t.need_zip = true
  t.package_files.include('protobox/*.js',
                          'protobox/*.css',
                          'protobox/images/protobox/*.*')
end

