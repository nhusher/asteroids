(ns asteroids.game)

(defn tween [proportion start end] (+ start (* (- end start) proportion)))

(defn interpolate [t c]
  (let [
        [before after] (split-with #(< (first %) t) c)
        [start end]    (cond
                         (nil? (last before)) (take 2 c)
                         (nil? (first after)) (take-last 2 c)
                         :else [(last before) (first after)])
         ratio (float (/ (- t (first start)) (- (first end) (first start))))
       ]
    (map (partial tween ratio) (second start) (second end))))

