FROM ubuntu:devel

RUN apt-get update -qq
RUN apt-get install -y --no-install-recommends nodejs

# add setup_cpp.js
ADD "./dist/" "/"
WORKDIR "/"

# run installation
RUN node ./setup_cpp.js --compiler llvm --cmake true --ninja true --cppcheck true --ccache true --vcpkg true --doxygen true --gcovr true

# reload the environment and print the versions
CMD source ~/.cpprc && clang --version && cmake --version && ninja --version && ccache --version && cppcheck --version && vcpkg --version && doxygen --version && dot --version && gcovr --version

ENTRYPOINT [ "/bin/sh" ]