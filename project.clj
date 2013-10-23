(defproject asteroids "0.0.1"
  :source-paths ["src/clj"]
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [org.clojure/clojurescript "0.0-1934"
                   :exclusions [org.apache.ant]]
                 [compojure "1.0.4"]
                 [hiccup "1.0.0"]]

  :plugins [[lein-cljsbuild "0.3.4"]
            [lein-ring "0.7.0"]]
            
  :cljsbuild {
    :builds [{
      :source-paths ["src/cljs"]
      :compiler {
        :output-to "resources/public/js/main.js"
        :optimizations :whitespace
        :pretty-print true
      }
    }]
  }
  :ring { :handler asteroids.routes/app })