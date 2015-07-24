////
/// @author Tyler Benton
/// @page tests/java-file
////

/// @name HelloWorldApp
/// @description
/// A very simple class to print out `Hello World`
class HelloWorldApp {
  public static void main(String[] args) {
    System.out.println("Hello World!");
  }
}

// This is a normal single-line comment, and shouldn't start a new block

/// @name Something
/// @description
/// This is a normal multi-line comment.
class saySomething {
  public static void main(String[] args) {
    System.out.println("something!");
  }
}

/// @name Something else
/// @description
/// This is another normal multi-line comment.
class saySomethingElse {
  public static void main(String[] args) {
    System.out.println("something else!");
  }
}
