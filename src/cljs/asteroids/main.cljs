(ns asteroids.main
  (:require [asteroids.game :as game]
            [goog.dom :as dom]
            [asteroids.draw :as draw])
  (:require-macros [asteroids.draw-macros :as dm]))

(def curve (sorted-map
            8000  [1  16]
            15000 [4  15]
            31000 [6  20]
            32000 [10 20]
            35000 [10 16]))

(def curve2 (sorted-map
            8000  [100]
            15000 [90]
            31000 [60]))

(def CX (draw/surface (dom/getElement "c")))
(def SHIP1 [ [0,-10] [-8,5] [-7,8] [7,8]  [8,5] :close])
(def SHIP2 [ [-2,2]  [2,2]  [3,0]  [0,-5] [-3,0] :close])
(def CENTER [(/ (.-width (dom/getElement "c")) 2) (/ (.-height (dom/getElement "c")) 2)])

(defn rad [deg] (/ (* deg (.-PI js/Math)) 180))

;              (dm/rotate CONTEXT (rad 270)
;                         (draw/line CONTEXT SHIP1)
;                         (draw/line CONTEXT SHIP2)))

(dm/translate CX CENTER
              (draw/line CX SHIP1)
              (draw/line CX SHIP2))
