(defproject asteroids "0.0.1-SNAPSHOT"
  :description "A version of asteroids written in Clojure"
  :url "https://github.com/nhusher/asteroids"

  :dependencies [
                 [org.clojure/clojure "1.5.1"]
                 [org.clojure/clojurescript "0.0-2030"]]

  :plugins [[lein-cljsbuild "1.0.0-alpha2"]]

  :source-paths ["src/clj"]
  :hooks [leiningen.cljsbuild]

  :cljsbuild {
    :crossovers [asteroids.game]
    :builds [{
      :source-paths ["src/cljs"]
      :compiler {:output-to "assets/js/main.js"
                 :pretty-print true
                 :incremental true
                 :source-map "assets/js/main.js.map"
      }
    }]
  })
