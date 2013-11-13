(ns asteroids.draw-macros)

(defmacro translate [cx points & body]
  `(do
     (.save ~cx)
     (.translate ~cx (first ~points) (second ~points))
     ~@body
     (.restore ~cx)))

(defmacro rotate [cx angle & body]
  `(do
      (.save ~cx)
      (.rotate ~cx ~angle)
      ~@body
      (.restore ~cx)))




;(def CENTER [50 50])
;(println (macroexpand-1 '(translate 1 CENTER (println "FOO"))))
;(println (macroexpand-1 '(rotate 1 (dec 45) (println "HELLO") (println "WORLD"))))
