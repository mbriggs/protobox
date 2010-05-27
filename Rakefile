require 'rake/packagetask'

def version
  @version ||= File.open('VERSION').read.chomp
  @version
end

Rake::PackageTask.new 'protobox', version do |t|
  t.need_tar_gz = true
  t.package_files.include('protobox/*.js',
                          'protobox/*.css',
                          'protobox/images/protobox/*.*')
end


