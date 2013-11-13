(ns asteroids.draw)

(defn surface [el]
  (do
    (set! (.-width el) (.-offsetWidth el))
    (set! (.-height el) (.-offsetHeight el))
    (.getContext el "2d")))

(defn line [cx points]
  (let [draw-line (fn [xy] (.lineTo cx (first xy) (second xy)))]
    (do
      (.beginPath cx)
      (.moveTo cx (ffirst points) (second (first points)))
      (doseq [pt (butlast points)] (draw-line pt))
      (if (= (last points) :close)
        (.closePath cx)
        (draw-line (last points)))
      (.stroke cx))))
